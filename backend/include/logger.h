#ifndef LOGGER_H_
#define LOGGER_H_

#include <iostream>
#include <string>
#include <sstream>
#include <mutex>
#include <chrono>
#include <iomanip>
#include <fstream>

/**
 * @brief 日志模块
 * 
 */
enum class LogLevel
{
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
};

class Logger
{
public:
    /**
     * @brief 设置日志最低等级
     */
    static void set_level(LogLevel level)
    {
        get_instance().min_level_ = level;
    }

    static void set_file(const std::string& filepath)
    {
        auto& inst = get_instance();
        std::lock_guard<std::mutex> lock(inst.mutex_);
        inst.file_stream_.open(filepath, std::ios::app);
        if (!inst.file_stream_.is_open())
        {
            std::cerr << "[Logger] 无法打开日志文件: " << filepath << std::endl;
        }
    }

    template<typename... Args>
    static void debug(const std::string& fmt, Args&&... args) {
        log(LogLevel::DEBUG, fmt, std::forward<Args>(args)...);
    }

    template<typename... Args>
    static void info(const std::string& fmt, Args&&... args) {
        log(LogLevel::INFO, fmt, std::forward<Args>(args)...);
    }

    template<typename... Args>
    static void warn(const std::string& fmt, Args&&... args) {
        log(LogLevel::WARN, fmt, std::forward<Args>(args)...);
    }

    template<typename... Args>
    static void error(const std::string& fmt, Args&&... args) {
        log(LogLevel::ERROR, fmt, std::forward<Args>(args)...);
    }

private:
    LogLevel min_level_ = LogLevel::DEBUG;
    std::mutex mutex_;
    std::ofstream file_stream_;

    static Logger& get_instance() 
    {
        static Logger instance;
        return instance;
    }

    Logger() = default;
    ~Logger() 
    {
        if (file_stream.is_open())
        {
            file_stream_.close();
        }
    }

    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

    /**
     * @brief 获取当前时间戳
     */
    static std::string get_timestamp()
    {
        auto now = std::chrono::system_clock::now();
        auto time_t_now = std::chrono::system_clock::to_time_t(now);
        auto ms = std::chrono::duration::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()) % 1000;

        std::tm tm_buf;
#ifdef _WIN32
        localtime_s(&tm_buf, &time_t_now);
#else
        localtime_r(&time_t_now, &tm_buf);
#endif

        std::ostringstream oss;
        oss << std::put_time(&tm_buf, "%Y-%m-%d %H:%M:%S") << '.' << std::setfill('0') << std::setw(3) << ms.count();
        return oss.str();
    }

    /**
     * @brief 获取日志级别对应的标签字符串
     */
    static const char* level_to_string(LogLevel level)
    {
        switch (level) 
        {
            case LogLevel::DEBUG: return "DEBUG";
            case LogLevel::INFO:  return "INFO";
            case LogLevel::WARN:  return "WARN";
            case LogLevel::ERROR: return "ERROR";
            default:              return "?????";
        }
    }

    /**
     * @brief 获取日志级别对应的终端颜色代码
     */
    static const char* level_to_color(LogLevel level) {
        switch (level) {
            case LogLevel::DEBUG: return "\033[36m";   // 青色
            case LogLevel::INFO:  return "\033[32m";   // 绿色
            case LogLevel::WARN:  return "\033[33m";   // 黄色
            case LogLevel::ERROR: return "\033[31m";   // 红色
            default:              return "\033[0m";     // 默认
        }
    }

    /**
     * @brief 格式化字符串
     */
    static std::string format(const std::string& fmt)
    {
        return fmt;
    }

    template<typename T, typename... Args>
    static std::string format(const std::string& fmt, T&& first, Args&&... rest)
    {
        std::string result;
        result.reserve(fmt.size());
        size_t pos = fmt.find("{}");
        if (std::string::npos == pos)
        {
            return fmt;
        }

        result.append(fmt, 0, pos);
        std::ostringstream oss;
        oss << std::forward<T>(first);
        result.append(oss.str());
        result.append(fmt, pos + 2);

        return format(result, std::forward<Args>(rest)...);
    }

    template<typename... Args>
    static void log(LogLevel level, const std::string& fmt, Args&&... args)
    {
        auto& inst = get_instance();
        if (level < inst.min_level_)
        {
            return;
        }

        std::string message = format(fmt, std::forward<Args>(args)...);
        std::string timestamp = get_timestamp();
        const char* level_str = level_to_string(level);
        const char* color = level_to_color(level);
        const char* reset = "\033[0m";

        std::lock_guard<std::mutex> lock(inst.mutex_);

        std::cout << color
                  << "[" << timestamp << "] "
                  << "[" << level_str << "] "
                  << reset
                  << message
                  << std::endl;

        if (inst.file_stream_.is_open())
        {
            inst.file_stream_ << "[" << timestamp << "] "
                              << "[" << level_str << "] "
                              << message
                              << std::endl;
        }
    }
};

#define LOG_DEBUG(...) Logger::debug(__VA_ARGS__)
#define LOG_INFO(...)  Logger::info(__VA_ARGS__)
#define LOG_WARN(...)  Logger::warn(__VA_ARGS__)
#define LOG_ERROR(...) Logger::error(__VA_ARGS__)

#define LOG_SET_LEVEL(level) Logger::set_level(level)
#define LOG_SET_FILE(path)   Logger::set_file(path)