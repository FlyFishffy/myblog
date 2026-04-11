/**
 * @file post_routes.cpp
 * @brief 文章相关 API 路由 - 实现
 * 
 * 对应前端 api.ts 中的接口：
 *   GET    /api/posts       -> fetchPosts()
 *   POST   /api/posts       -> createPost()
 *   GET    /api/posts/:slug -> fetchPost(slug)
 *   PUT    /api/posts/:slug -> updatePost(slug)
 *   DELETE /api/posts/:slug -> deletePost(slug)
 */

#include "routes/post_routes.h"
#include "logger.h"
#include <nlohmann/json.hpp>
#include <sstream>
#include <iomanip>

using json = nlohmann::json;

namespace blog
{

/**
 * @brief URL decode: convert %XX sequences back to original characters
 * e.g. "cpp%20start" -> "cpp start"
 */
static std::string url_decode(const std::string& encoded)
{
    std::string decoded;
    decoded.reserve(encoded.size());

    for (std::size_t i = 0; i < encoded.size(); ++i)
    {
        if (encoded[i] == '%' && i + 2 < encoded.size())
        {
            std::string hex = encoded.substr(i + 1, 2);
            try
            {
                unsigned long ch = std::stoul(hex, nullptr, 16);
                decoded += static_cast<char>(ch);
                i += 2;
            }
            catch (...)
            {
                decoded += encoded[i];
            }
        }
        else if (encoded[i] == '+')
        {
            decoded += ' ';
        }
        else
        {
            decoded += encoded[i];
        }
    }

    return decoded;
}

/**
 * @brief 将 Post 结构体转换为 JSON 对象
 */
static json post_to_json(const Post& post, bool with_content = false)
{
    json j;
    j["id"]         = post.id;
    j["title"]      = post.title;
    j["slug"]       = post.slug;
    j["summary"]    = post.summary;
    j["tags"]       = post.tags;
    j["word_count"] = post.word_count;
    j["created_at"] = post.created_at;
    j["updated_at"] = post.updated_at;

    if (with_content)
    {
        j["content"] = post.content;
    }

    return j;
}

/**
 * @brief 验证请求中的 auth token
 * @return true if token is valid
 */
static bool verify_token(const crow::request& req)
{
    return req.get_header_value("X-Auth-Token") == "flyfish";
}

/**
 * @brief 构建 JSON 错误响应
 */
static crow::response error_response(int code, const std::string& error, const std::string& detail = "")
{
    json err;
    err["error"] = error;
    if (!detail.empty())
    {
        err["detail"] = detail;
    }
    auto res = crow::response(code, err.dump());
    res.set_header("Content-Type", "application/json");
    return res;
}

void register_post_routes(crow::SimpleApp& app, std::shared_ptr<Database> db)
{
    // -----------------------------------------
    // /api/posts - GET (list) + POST (create)
    // Merged into one CROW_ROUTE to avoid Crow overwrite issue
    // -----------------------------------------
    CROW_ROUTE(app, "/api/posts").methods("GET"_method, "POST"_method)
    ([db](const crow::request& req) {

        // ===== GET /api/posts =====
        if (req.method == crow::HTTPMethod::GET)
        {
            try
            {
                auto posts = db->get_all_posts();

                json posts_array = json::array();
                for (const auto& post : posts)
                {
                    posts_array.push_back(post_to_json(post, false));
                }

                json response;
                response["posts"] = posts_array;
                response["total"] = static_cast<int>(posts.size());

                auto res = crow::response(200, response.dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }
            catch (const std::exception& e)
            {
                LOG_ERROR("获取文章列表接口异常: {}", e.what());
                return error_response(500, "获取文章列表失败", e.what());
            }
        }

        // ===== POST /api/posts =====
        try
        {
            if (!verify_token(req))
            {
                return error_response(401, "未授权访问");
            }

            auto body = json::parse(req.body);

            std::string title   = body.value("title", "");
            std::string slug    = body.value("slug", "");
            std::string summary = body.value("summary", "");
            std::string content = body.value("content", "");
            std::string tags    = body.value("tags", "");

            if (title.empty() || slug.empty() || content.empty())
            {
                return error_response(400, "标题、Slug 和正文为必填项");
            }

            auto post = db->create_post(title, slug, summary, content, tags);

            auto res = crow::response(201, post_to_json(post, true).dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
        catch (const json::parse_error& e)
        {
            LOG_ERROR("创建文章请求体解析失败: {}", e.what());
            return error_response(400, "请求体格式错误", e.what());
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("创建文章接口异常: {}", e.what());
            return error_response(500, "创建文章失败", e.what());
        }
    });

    // -----------------------------------------
    // /api/posts/<slug> - GET (detail) + PUT (update) + DELETE
    // MUST be in one CROW_ROUTE to avoid Crow overwrite issue
    // -----------------------------------------
    CROW_ROUTE(app, "/api/posts/<string>").methods("GET"_method, "PUT"_method, "DELETE"_method)
    ([db](const crow::request& req, const std::string& raw_slug) {

        // Decode URL-encoded slug (e.g. "cpp%20start" -> "cpp start")
        const std::string slug = url_decode(raw_slug);

        // ===== GET /api/posts/<slug> =====
        if (req.method == crow::HTTPMethod::GET)
        {
            try
            {
                auto post = db->get_post_by_slug(slug);

                if (!post.has_value())
                {
                    return error_response(404, "文章不存在");
                }

                auto res = crow::response(200, post_to_json(post.value(), true).dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }
            catch (const std::exception& e)
            {
                LOG_ERROR("获取文章详情接口异常: {}", e.what());
                return error_response(500, "获取文章详情失败", e.what());
            }
        }

        // ===== PUT /api/posts/<slug> =====
        if (req.method == crow::HTTPMethod::PUT)
        {
            try
            {
                if (!verify_token(req))
                {
                    return error_response(401, "未授权访问");
                }

                auto body = json::parse(req.body);

                std::string title   = body.value("title", "");
                std::string summary = body.value("summary", "");
                std::string content = body.value("content", "");
                std::string tags    = body.value("tags", "");

                if (title.empty() || content.empty())
                {
                    return error_response(400, "标题和正文为必填项");
                }

                auto post = db->update_post(slug, title, summary, content, tags);

                auto res = crow::response(200, post_to_json(post, true).dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }
            catch (const json::parse_error& e)
            {
                LOG_ERROR("更新文章请求体解析失败: {}", e.what());
                return error_response(400, "请求体格式错误", e.what());
            }
            catch (const std::exception& e)
            {
                LOG_ERROR("更新文章接口异常: {}", e.what());
                return error_response(500, "更新文章失败", e.what());
            }
        }

        // ===== DELETE /api/posts/<slug> =====
        try
        {
            if (!verify_token(req))
            {
                return error_response(401, "未授权访问");
            }

            bool deleted = db->delete_post(slug);

            if (!deleted)
            {
                return error_response(404, "文章不存在");
            }

            json response;
            response["message"] = "文章已删除";
            response["slug"] = slug;
            auto res = crow::response(200, response.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("删除文章接口异常: {}", e.what());
            return error_response(500, "删除文章失败", e.what());
        }
    });

    LOG_INFO("文章路由注册完成");
}

} // namespace blog