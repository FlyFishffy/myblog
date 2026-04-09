/**
 * @file main.cpp
 * @brief 博客后端主程序入口
 * 
 * 初始化日志、数据库、注册路由、启动 HTTP 服务
 */

#include "logger.h"
#include "database.h"
#include "routes/post_routes.h"
#include <crow.h>
#include <memory>

int main()
{
    // ========================================
    // 1. 初始化日志模块
    // ========================================
    LOG_SET_LEVEL(LogLevel::DEBUG);
    LOG_SET_FILE("myblog.log");
    LOG_INFO("========================================");
    LOG_INFO("  myblog 后端服务启动中...");
    LOG_INFO("========================================");

    // ========================================
    // 2. 初始化数据库
    // ========================================
    std::shared_ptr<blog::Database> db;
    try
    {
        std::string conn_str =
            "host=127.0.0.1 "
            "port=5432 "
            "dbname=myblog "
            "user=bloguser "
            "password=1145237870";

        db = std::make_shared<blog::Database>(conn_str, 5);
    }
    catch (const std::exception& e)
    {
        LOG_ERROR("数据库初始化失败: {}", e.what());
        LOG_ERROR("请检查 PostgreSQL 是否运行以及连接参数是否正确");
        return 1;
    }

    // ========================================
    // 3. 创建 Crow 应用并注册路由
    // ========================================
    crow::SimpleApp app;
    blog::register_post_routes(app, db);

    // ========================================
    // 4. 启动 HTTP 服务
    // ========================================
    LOG_INFO("HTTP 服务启动，监听端口: 3639");
    app.port(3639)
       .bindaddr("0.0.0.0")
       .multithreaded()
       .run();

    return 0;
}
