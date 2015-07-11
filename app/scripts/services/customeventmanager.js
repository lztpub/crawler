/**
 * Created by lijia on 3/13/15.
 */
var CustomEventManagerSingleton = (function () {
  var instance;

  function createInstance() {
    var customEventManager = new CustomEventManager();
    return customEventManager;
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

var CustomEventManager = function(){
  this.eventListnerMap = {};
};

CustomEventManager.prototype.on = function(eventName,listner){
  var self = this;
  var listners = self.eventListnerMap[eventName];
  if(!listners){
    listners = self.eventListnerMap[eventName] = [];
  }
  listners.push(listner);
};

/**
 *
 * @ngdoc method
 * @module apfPrototypeJs
 * @name CustomEventManager#emit
 * @param {string} eventName Event Name
 * @param {array} args Arguments
 * @description
 Call observer functions which are registered by {@link CustomEventManagerProvider}.
 */
CustomEventManager.prototype.emit = function(eventName,args){
  var self = this;
  var listners = self.eventListnerMap[eventName];
  $.each(listners||[],function(idx, listner){
    listner.func.apply(listner.owner,{
      eventName:eventName,
      args:args
    });
  });
};

