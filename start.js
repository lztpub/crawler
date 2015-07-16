var server = require("./server/server");
var router = require("./server/router");
var controller = require("./server/controller");

var map = {};
// say hello and do nothing
map["/"] = controller.home;
// Check if the server is alive
map["/check"] = controller.check;
// Start crawing from injection-generation-fetch-parse-updatedb-inverselink-indexing
map["/start"] = controller.start;
// get some console output
map["/display"] = controller.display;
// TODO: Stop current crawl (not support yet)
map["/stop"] = controller.stop;
// Get stats info about crawldb and list target domains
map["/stats"] = controller.stats;
// change the list of target domains
map["/modify"] = controller.modify;

server.start(router.route, map);