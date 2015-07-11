/**
 * Created by lijia on 2/15/15.
 */
var UserServiceDelegateSingleton = (function () {
  var instance;

  function createInstance() {
    var userServiceDelegate = new UserServiceDelegate();
    return userServiceDelegate;
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

function UserServiceDelegate() {
  this.testUserData = [];
}

UserServiceDelegate.prototype.loadUsersData = function() {
  var self = this;
  return this.loadData('users.json').success(function(data){
    self.testUserData = data;
  });
};

UserServiceDelegate.prototype.loadData = function(jsonString){
  return RestManagerSingleton.getInstance().send({
    method:'GET',
    url:'scripts/services/test_data/' + jsonString
  });
};

UserServiceDelegate.prototype.find = function(userId){
  var id = parseInt(userId);
  var deferred = $.Deferred();
  this.loadUsersData().success(function(data){
    for(var i = 0;i<data.length;i++){
      if(data[i].id === id){
        deferred.resolve(data[i]);
      }
    }
  });
  return MockManagerSingleton.getInstance().createDefer(null, deferred);
};

UserServiceDelegate.prototype.selectAll = function(){
  return this.loadUsersData();
};
