#include "database.h"

#include <iostream>
#include <stdexcept>
#include <condition_variable>

namespace blog
{
    
    ConnectionPool::ConnectionPool(const str::string& conn_str, int pool_size)
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
                    std::cout << 
                }
            }
            catch(const std::exception& e)
            {
                std::cerr << e.what() << '\n';
            }
            
        }
    }

} // namespace blog