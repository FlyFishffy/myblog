#ifndef DATABASE_H_
#define DATABASE_H_

#include <string>
#include <vector>
#include <queue>
#include <memory>
#include <pqxx/pqxx>
#include <mutex>
#include <optional>

namespace blog
{

class ConnectionPool
{
public:
    ConnectionPool(const std::string& conn_str, int pool_size = 5);
    ~ConnectionPool();

    class ConnectionGuard
    {
    public:
        ConnectionGuard(std::shared_ptr<pqxx::connection> conn, ConnectionPool& pool);
        ~ConnectionGuard();
        ConnectionGuard(const ConnectionGuard&) = delete;
        ConnectionGuard& operator=(const ConnectionGuard&) = delete;
        ConnectionGuard(ConnectionGuard&& other) noexcept;
        ConnectionGuard& operator=(ConnectionGuard&& other) noexcept;

        pqxx::connection& get();
        pqxx::connection* operator->();
    
    private:
        std::shared_ptr<pqxx::connection> conn_;
        ConnectionPool* pool_;
    };
private:
    std::queue<std::shared_ptr<pqxx::connection>> pool_;
    std::mutex mutex_;
    std::condition_variable cv_;
    std::string conn_str_;
}

struct Post
{
    int id;
    std::string title;
    std::string slug;
    std::string summary;
    std::string content;
    std::string tags;
    int word_count;
    std::string created_at;
    std::string updated_at;
};

class Database
{
public:
    explicit Database(const std::string& conn_str, int pool_size = 5);
    std::vector<Post> get_all_posts();
    std::optional<Post> get_post_by_slug(const std::string& slug);

private:
    ConnectionPool pool_;
    Post row_to_post(const pqxx::row& row, bool with_content = false);
};

} // namespace blog

#endif // DATABASE_H_