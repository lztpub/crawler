/**
 * Created by lijia on 3/12/15.
 */

var MockManagerSingleton = (function () {
  var instance;

  function createInstance() {
    var mockManager = new MockManager();
    return mockManager;
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

var MockManager = function(){};


/**
 *
 * @ngdoc method
 * @name MockManager#createDefer
 * @param {object} data MockData
 * @return {object}
 Register callback function.
 This interfaces is equal to {@link RestManager} one。

 #### success Callback
 Register callback function which is called when REST request succeed.

 #### error Callback
 Register callback function which is called when REST request fail.

 * @description
 create same {@link RestManager}'s interface object.

 　　**/
MockManager.prototype.createDefer = function(data, deferredObj){
  var deferred = deferredObj ? deferredObj : $.Deferred();
  var promise = deferred;

  setTimeout(function(){
    if (!deferredObj) {
      deferred.resolve(data);
    }
  },0);

  //$http のメソッドを追加する
  promise.success = function(fn) {
    promise.then(function(data) {
      fn(data);
    });
    return this;
  };

  promise.error = function(fn) {
    promise.then(null,function(data) {
      fn(data);
    });
    return this;
  };
  return promise;
};

