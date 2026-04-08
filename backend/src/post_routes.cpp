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
}

} // namespace blog