var http = require("http");
var url = require("url");

function start(route, map) {
	function onRequest(request, response) {
		var pathname = url.parse(request.url).pathname;
		//console.log("Request for " + pathname + " received.");
		
		var postData = "";
		request.setEncoding("utf8");
		
		request.on("data", function(data) {
			postData += data;
		//	console.log("Received POST data chunk '" + data + "'.");
		});
		
		request.on("end", function() {
			route(map, pathname, response, postData);
		});
	}

	http.createServer(onRequest).listen(6600);
	//console.log("Server has started.");
}

exports.start = start;