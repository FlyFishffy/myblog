#ifndef POST_ROUTES_H_
#define POST_ROUTES_H_

#include <crow.h>
#include <memory>
#include "database.h"

namespace blog
{

void register_post_routes(crow::SimpleApp& app, std::shared_ptr<Database> db);

} // namespace blog

#endif // POST_ROUTES_H_