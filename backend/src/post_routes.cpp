/**
 * @file post_routes.cpp
 * @brief 文章相关 API 路由 - 实现
 * 
 * 对应前端 api.ts 中的接口：
 *   GET /api/posts       -> fetchPosts()
 *   GET /api/posts/:slug -> fetchPost(slug)
 */

#include "routes/post_routes.h"
#include "logger.h"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace blog
{

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

void register_post_routes(crow::SimpleApp& app, std::shared_ptr<Database> db)
{
    // -----------------------------------------
    // GET /api/posts - 获取文章列表
    // 返回格式: { "posts": [...], "total": N }
    // -----------------------------------------
    CROW_ROUTE(app, "/api/posts").methods("GET"_method)
    ([db]() {
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
            json err;
            err["error"]  = "获取文章列表失败";
            err["detail"] = e.what();
            auto res = crow::response(500, err.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
    });

    // -----------------------------------------
    // GET /api/posts/<slug> - 根据 slug 获取文章详情
    // 返回格式: { "id": ..., "title": ..., "content": ..., ... }
    // -----------------------------------------
    CROW_ROUTE(app, "/api/posts/<string>").methods("GET"_method)
    ([db](const std::string& slug) {
        try
        {
            auto post = db->get_post_by_slug(slug);

            if (!post.has_value())
            {
                json err;
                err["error"] = "文章不存在";
                auto res = crow::response(404, err.dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }

            auto res = crow::response(200, post_to_json(post.value(), true).dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("获取文章详情接口异常: {}", e.what());
            json err;
            err["error"]  = "获取文章详情失败";
            err["detail"] = e.what();
            auto res = crow::response(500, err.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
    });

    LOG_INFO("文章路由注册完成");

    // -----------------------------------------
    // POST /api/posts - 创建新文章 (需要 token 验证)
    // 请求头: X-Auth-Token: flyfish
    // 请求体: { "title", "slug", "summary", "content", "tags" }
    // -----------------------------------------
    CROW_ROUTE(app, "/api/posts").methods("POST"_method)
    ([db](const crow::request& req) {
        try
        {
            // Verify auth token
            auto token = req.get_header_value("X-Auth-Token");
            if (token != "flyfish")
            {
                json err;
                err["error"] = "未授权访问";
                auto res = crow::response(401, err.dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }

            // Parse request body
            auto body = json::parse(req.body);

            std::string title   = body.value("title", "");
            std::string slug    = body.value("slug", "");
            std::string summary = body.value("summary", "");
            std::string content = body.value("content", "");
            std::string tags    = body.value("tags", "");

            if (title.empty() || slug.empty() || content.empty())
            {
                json err;
                err["error"] = "标题、Slug 和正文为必填项";
                auto res = crow::response(400, err.dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }

            auto post = db->create_post(title, slug, summary, content, tags);

            auto res = crow::response(201, post_to_json(post, true).dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
        catch (const json::parse_error& e)
        {
            LOG_ERROR("创建文章请求体解析失败: {}", e.what());
            json err;
            err["error"]  = "请求体格式错误";
            err["detail"] = e.what();
            auto res = crow::response(400, err.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("创建文章接口异常: {}", e.what());
            json err;
            err["error"]  = "创建文章失败";
            err["detail"] = e.what();
            auto res = crow::response(500, err.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
    });

    // -----------------------------------------
    // PUT /api/posts/<slug> - 更新文章 (需要 token 验证)
    // 请求头: X-Auth-Token: flyfish
    // 请求体: { "title", "summary", "content", "tags" }
    // -----------------------------------------
    CROW_ROUTE(app, "/api/posts/<string>").methods("PUT"_method)
    ([db](const crow::request& req, const std::string& slug) {
        try
        {
            // Verify auth token
            auto token = req.get_header_value("X-Auth-Token");
            if (token != "flyfish")
            {
                json err;
                err["error"] = "未授权访问";
                auto res = crow::response(401, err.dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }

            // Parse request body
            auto body = json::parse(req.body);

            std::string title   = body.value("title", "");
            std::string summary = body.value("summary", "");
            std::string content = body.value("content", "");
            std::string tags    = body.value("tags", "");

            if (title.empty() || content.empty())
            {
                json err;
                err["error"] = "标题和正文为必填项";
                auto res = crow::response(400, err.dump());
                res.set_header("Content-Type", "application/json");
                return res;
            }

            auto post = db->update_post(slug, title, summary, content, tags);

            auto res = crow::response(200, post_to_json(post, true).dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
        catch (const json::parse_error& e)
        {
            LOG_ERROR("更新文章请求体解析失败: {}", e.what());
            json err;
            err["error"]  = "请求体格式错误";
            err["detail"] = e.what();
            auto res = crow::response(400, err.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("更新文章接口异常: {}", e.what());
            json err;
            err["error"]  = "更新文章失败";
            err["detail"] = e.what();
            auto res = crow::response(500, err.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        }
    });
}

} // namespace blog