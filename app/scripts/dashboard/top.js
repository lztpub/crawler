/**
 * Created by xukai on 7/12/15.
 */
function TopController() {
};

TopController.prototype.init = function() {

	$("#dashboard").load("assets/html/dashboard/dashboard.html", function(){
	});

	$("#console").load("assets/html/dashboard/console.html", function(){
	});

};