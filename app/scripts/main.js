/* jshint devel:true */
var RootScopeSingleton = (function () {
  var instance;

  function createInstance() {
    var rootScope = new RootScope();
    return rootScope;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

var RootScope = function () {
   this.selectedJob = null;
};

$(document).ready(function(){
  $('#root').load("assets/html/dashboard/dashboard.html", function() {
    console.log("load dashboard");
  });
});
