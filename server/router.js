function route(map, pathname, response, postData) {
	if (typeof map[pathname] === 'function') {
		map[pathname](response, postData);
	} else {
		response.writeHead(404, {"Content-Type": "text/html"});
		response.write("404 Not found");
		response.end();
	}
}

exports.route = route;
