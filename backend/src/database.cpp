#include "database.h"
#include "logger.h"

#include <string>
#include <vector>
#include <regex>


namespace blog
{

/**
 * @brief Count UTF-8 characters (not bytes) in a string
 */
static int count_utf8_chars(const std::string& str)
{
    int count = 0;
    for (size_t i = 0; i < str.size(); )
    {
        unsigned char c = static_cast<unsigned char>(str[i]);
        if (c < 0x80)        i += 1;
        else if (c < 0xE0)   i += 2;
        else if (c < 0xF0)   i += 3;
        else                 i += 4;
        ++count;
    }
    return count;
}

/**
 * @brief Strip Markdown syntax and count only visible text characters.
 *
 * Removes: headings (#), bold/italic (** _ ~~), links/images, code blocks,
 * inline code, HTML tags, blockquotes (>), horizontal rules, list markers, etc.
 */
static int count_markdown_words(const std::string& content)
{
    std::string text = content;

    // Remove fenced code blocks (``` ... ```)
    text = std::regex_replace(text, std::regex("```[\\s\\S]*?```"), "");

    // Remove inline code (`...`)
    text = std::regex_replace(text, std::regex("`[^`]*`"), "");

    // Remove images ![alt](url)
    text = std::regex_replace(text, std::regex("!\\[[^\\]]*\\]\\([^)]*\\)"), "");

    // Remove links [text](url) -> keep text
    text = std::regex_replace(text, std::regex("\\[([^\\]]*)\\]\\([^)]*\\)"), "$1");

    // Remove HTML tags
    text = std::regex_replace(text, std::regex("<[^>]+>"), "");

    // Remove heading markers (# ## ### etc.)
    text = std::regex_replace(text, std::regex("(?:^|\n)#{1,6}\\s*"), "\n");

    // Remove bold/italic/strikethrough markers
    text = std::regex_replace(text, std::regex("\\*{1,3}|_{1,3}|~~"), "");

    // Remove blockquote markers
    text = std::regex_replace(text, std::regex("(?:^|\n)>+\\s*"), "\n");

    // Remove horizontal rules (---, ***, ___)
    text = std::regex_replace(text, std::regex("(?:^|\n)[-*_]{3,}\\s*"), "\n");

    // Remove unordered list markers (- * +)
    text = std::regex_replace(text, std::regex("(?:^|\n)\\s*[-*+]\\s+"), "\n");

    // Remove ordered list markers (1. 2. etc.)
    text = std::regex_replace(text, std::regex("(?:^|\n)\\s*\\d+\\.\\s+"), "\n");

    // Remove table separators (|---|---|)
    text = std::regex_replace(text, std::regex("(?:^|\n)\\|?[\\s:]*[-]+[\\s:]*(?:\\|[\\s:]*[-]+[\\s:]*)*\\|?\\s*"), "\n");

    // Remove table pipe characters
    text = std::regex_replace(text, std::regex("\\|"), " ");

    // Remove extra whitespace and newlines, then count non-whitespace characters
    std::string clean;
    for (size_t i = 0; i < text.size(); )
    {
        unsigned char c = static_cast<unsigned char>(text[i]);
        // Skip ASCII whitespace
        if (c == ' ' || c == '\t' || c == '\n' || c == '\r')
        {
            ++i;
            continue;
        }
        // Determine UTF-8 character length and keep it
        int len = 1;
        if (c >= 0xF0)      len = 4;
        else if (c >= 0xE0) len = 3;
        else if (c >= 0xC0) len = 2;

        for (int j = 0; j < len && (i + j) < text.size(); ++j)
            clean += text[i + j];
        i += len;
    }

    return count_utf8_chars(clean);
}

    // =================================
    // ConnectionPool
    // =================================

    ConnectionPool::ConnectionPool(const std::string& conn_str, int pool_size)
        : conn_str_(conn_str)
    {
        for (int i = 0; i < pool_size; i++)
        {
            try
            {
                auto conn = std::make_shared<pqxx::connection>(conn_str);
                if (conn->is_open())
                {
                    pool_.push(conn);
                    LOG_DEBUG("No: {} connetion created successfully.", i + 1);
                }
                else
                {
                    LOG_ERROR("No: {} connection created failed.", i + 1);
                }
            }
            catch(const std::exception& e)
            {
                LOG_ERROR("failed to creat database connection: {}", e.what());
                throw;
            }
        }
        LOG_INFO("database created successfully, created {} connections.", pool_.size());
    }

    ConnectionPool::~ConnectionPool()
    {
        std::lock_guard<std::mutex> lock(mutex_);
        while (!pool_.empty())
        {
            pool_.pop();
        }
        LOG_INFO("database pool closed.");
    }

    std::shared_ptr<pqxx::connection> ConnectionPool::acquire()
    {
        std::unique_lock<std::mutex> lock(mutex_);
        cv_.wait(lock, [this]() { return !pool_.empty(); });

        auto conn = pool_.front();
        pool_.pop();
        return conn;
    }

    void ConnectionPool::release(std::shared_ptr<pqxx::connection> conn)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        pool_.push(conn);
        cv_.notify_one();
    } 

    ConnectionPool::ConnectionGuard ConnectionPool::get_connection()
    {
        auto conn = acquire();
        return ConnectionGuard(conn, *this);
    }

    // =================================
    // ConnectionGuard
    // =================================

    ConnectionPool::ConnectionGuard::ConnectionGuard(
        std::shared_ptr<pqxx::connection> conn, ConnectionPool& pool)
        : conn_(std::move(conn)), pool_(&pool)
    {

    }

    ConnectionPool::ConnectionGuard::~ConnectionGuard()
    {
        if (conn_ && pool_)
        {
            pool_->release(conn_);
        }
    }

    ConnectionPool::ConnectionGuard::ConnectionGuard(ConnectionGuard&& other) noexcept
        : conn_(std::move(other.conn_)), pool_(other.pool_)
    {
        other.pool_ = nullptr;
    }

    ConnectionPool::ConnectionGuard& ConnectionPool::ConnectionGuard::operator=(ConnectionGuard&& other) noexcept
    {
        if (this != &other)
        {
            if (conn_ && pool_)
            {
                pool_->release(conn_);
            }
            conn_ = std::move(other.conn_);
            pool_ = other.pool_;
            other.pool_ = nullptr;
        }
        return *this;
    }

    pqxx::connection& ConnectionPool::ConnectionGuard::get()
    {
        return *conn_;
    }

    pqxx::connection* ConnectionPool::ConnectionGuard::operator->()
    {
        return conn_.get();
    }

    // =================================
    // Database
    // =================================

    Database::Database(const std::string& conn_str, int pool_size)
        : pool_(conn_str, pool_size)
    {
        LOG_INFO("init database successfully.");
    }

    Post Database::row_to_post(const pqxx::row& row, bool with_content)
    {
        Post post;
        post.id         = row["id"].as<int>();
        post.title      = row["title"].as<std::string>();
        post.slug       = row["slug"].as<std::string>();
        post.summary    = row["summary"].as<std::string>();
        post.tags       = row["tags"].as<std::string>();
        post.word_count = row["word_count"].as<int>(0);
        post.created_at = row["created_at"].as<std::string>();
        post.updated_at = row["updated_at"].as<std::string>();

        if (with_content) 
        {
            post.content = row["content"].as<std::string>();
        }

        return post;
    }

    std::vector<Post> Database::get_all_posts()
    {
        try
        {
            auto guard = pool_.get_connection();
            pqxx::work txn(guard.get());

            pqxx::result rows = txn.exec(
                "SELECT id, title, slug, summary, tags, word_count, "
                "to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, "
                "to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at "
                "FROM posts ORDER BY created_at DESC"
            );
            txn.commit();

            std::vector<Post> posts;
            posts.reserve(rows.size());
            for (const auto& row : rows)
            {
                posts.push_back(row_to_post(row, false));
            }

            LOG_INFO("获get article successfully, total num: {}", posts.size());
            return posts;
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("get article list failed: {}", e.what());
            throw;
        }
    }

    std::optional<Post> Database::get_post_by_slug(const std::string& slug)
    {
        try
        {
            auto guard = pool_.get_connection();
            pqxx::work txn(guard.get());

            pqxx::result rows = txn.exec_params(
                "SELECT id, title, slug, summary, content, tags, word_count, "
                "to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, "
                "to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at "
                "FROM posts WHERE slug = $1",
                slug
            );
            txn.commit();

            if (rows.empty())
            {
                LOG_WARN("article not exist: {}", slug);
                return std::nullopt;
            }

            LOG_INFO("get article successfully: {}", slug);
            return row_to_post(rows[0], true);
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("get article failed: {}", e.what());
            throw;
        }
    } // end of get_post_by_slug

    Post Database::create_post(const std::string& title, const std::string& slug,
                               const std::string& summary, const std::string& content,
                               const std::string& tags)
    {
        try
        {
            auto guard = pool_.get_connection();
            pqxx::work txn(guard.get());

            int word_count = count_markdown_words(content);

            pqxx::result rows = txn.exec_params(
                "INSERT INTO posts (title, slug, summary, content, tags, word_count) "
                "VALUES ($1, $2, $3, $4, $5, $6) "
                "RETURNING id, title, slug, summary, content, tags, word_count, "
                "to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, "
                "to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at",
                title, slug, summary, content, tags, word_count
            );
            txn.commit();

            LOG_INFO("create article successfully: {}", slug);
            return row_to_post(rows[0], true);
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("create article failed: {}", e.what());
            throw;
        }
    }

    Post Database::update_post(const std::string& slug, const std::string& title,
                               const std::string& summary, const std::string& content,
                               const std::string& tags)
    {
        try
        {
            auto guard = pool_.get_connection();
            pqxx::work txn(guard.get());

            int word_count = count_markdown_words(content);

            pqxx::result rows = txn.exec_params(
                "UPDATE posts SET title = $1, summary = $2, content = $3, tags = $4, "
                "word_count = $5, updated_at = NOW() "
                "WHERE slug = $6 "
                "RETURNING id, title, slug, summary, content, tags, word_count, "
                "to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, "
                "to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at",
                title, summary, content, tags, word_count, slug
            );
            txn.commit();

            if (rows.empty())
            {
                throw std::runtime_error("article not found: " + slug);
            }

            LOG_INFO("update article successfully: {}", slug);
            return row_to_post(rows[0], true);
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("update article failed: {}", e.what());
            throw;
        }
    }

    bool Database::delete_post(const std::string& slug)
    {
        try
        {
            auto guard = pool_.get_connection();
            pqxx::work txn(guard.get());

            pqxx::result rows = txn.exec_params(
                "DELETE FROM posts WHERE slug = $1 RETURNING id",
                slug
            );
            txn.commit();

            if (rows.empty())
            {
                LOG_WARN("delete article failed, not found: {}", slug);
                return false;
            }

            LOG_INFO("delete article successfully: {}", slug);
            return true;
        }
        catch (const std::exception& e)
        {
            LOG_ERROR("delete article failed: {}", e.what());
            throw;
        }
    }

} // namespace blog