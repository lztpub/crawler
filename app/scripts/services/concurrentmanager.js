/**
 * Created by lijia on 3/12/15.
 */
var ConcurrentManagerSingleton = (function () {
  var instance;

  function createInstance() {
    var concurrentManager = new ConcurrentManager();
    return concurrentManager;
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

var ConcurrentManager = function() {
  this.tasks={};
};

ConcurrentManager.prototype.asyncTask = function(taskKey, taskOwner,taskFunc, taskParameters) {
  var self = this;
  var taskList = self.tasks[taskKey];
  if (!taskList) {
    taskList = [];
    self.tasks[taskKey] = taskList;
    return taskFunc.apply(taskOwner,taskParameters).success(function(data){
      $.each(taskList, function(idx, deferred){
        deferred.resolve(data);
      });
      self.tasks[taskKey] = null;
    });
  } else {
    var deferred = $.Deferred();
    taskList.push(deferred);
    var Promise = function() {
      this.success = function(fn){
        deferred.then(fn);
        return this;
      };
      this.error = function(fn){
        return this;
      };
    };
    return new Promise();
  }
};
