cmake_minimum_required(VERSION 3.20)
project(myblog-backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ============================================
# 依赖管理：使用 FetchContent 自动下载第三方库
# ============================================
include(FetchContent)

# Crow HTTP 框架
FetchContent_Declare(
    crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG        v1.2.0
)

# nlohmann/json JSON库
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG        v3.11.3
)

# libpqxx PostgreSQL C++ 客户端库
FetchContent_Declare(
    libpqxx
    GIT_REPOSITORY https://github.com/jtv/libpqxx.git
    GIT_TAG        7.9.2
)

# 设置 libpqxx 选项：跳过构建测试
set(SKIP_BUILD_TEST ON CACHE BOOL "" FORCE)

FetchContent_MakeAvailable(crow json libpqxx)

# ============================================
# 构建目标：将所有 .cpp 源文件加入编译
# ============================================
add_executable(myblog-backend
    src/main.cpp
    src/logger.cpp
    src/database.cpp
    src/routes.cpp
)

# 头文件搜索路径
target_include_directories(myblog-backend PRIVATE
    ${CMAKE_SOURCE_DIR}/include
)

# 链接第三方库
target_link_libraries(myblog-backend PRIVATE
    Crow::Crow
    nlohmann_json::nlohmann_json
    pqxx
)
