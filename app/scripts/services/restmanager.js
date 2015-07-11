/**
 * Created by lijia on 3/12/15.
 */
var RestManagerSingleton = (function () {
  var instance;

  function createInstance() {
    var restManager = new RestManager();
    return restManager;
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

var RestManager = function(){

  /**
   * OW+'s control data
   */
  this.controlParamKey = null;


  /**
   * Request start time for perfomance  measurement
   */
  this.requestTime = 0;

  /**
   * Response complete time for perfomance  measurement
   */
  this.responseTime = 0;

  this.submitFlags = {};
  this.delay = 500;
};


/**
 * Show loding dialog.
 */
RestManager.prototype.loadingOn = function(){
};

/**
 * Hide Loding dialog.
 */
RestManager.prototype.loadingOff = function(requestTime){
  var self = this;
  if(requestTime > self.delay){
    return;
  }
  // wait if requestTime is shorter than delay.
  setTimeout(function(){
    return;
  },self.delay - requestTime);
};

/**
 * Common Error Handling for Rest Request.
 */
RestManager.prototype.ajaxErrorHandler = function(data,status){
  // when app error
  if(status === 400){
    // TODO implement error handoing , following error code rule on standalization.
    if(data.aina && data.aina.status_CODE > 50 ){
      showMessage(data.aina);
    } else {
      // when business Logic Error
      //showMessage(aina)
    }
  }
  // when request fail.
  else{
    alert('サーバの呼び出しに失敗しました [http-status=' + status + ']');
  }
};

/**
 * Error Handling for connecting check
 */
RestManager.prototype.doubleSubmitErrorHandler = function(){
  alert('通信中です');
};

/**
 * Send ajax request.
 */
RestManager.prototype.ajaxCall = function(options){
  var promise = $.ajax(options);
  var Promise = function() {
    this.success = function(fn){
      promise.success(fn);
      return this;
    };
    this.error = function(fn){
      promise.error(fn);
      return this;
    };
  };
  return new Promise();
};

/**
 *
 * @ngdoc method
 * @name RestManager#send
 * @param {object} options

 * @param {string} options.method
 HTTP method (ex: 'GET','POST' etc)

 * @param {string} options.url
 HTTP Request URL

 * @param {object} options.param
 HTTP Request Query String

 * @param {object} options.data
 HTTP Request Message Body Data

 * @return {Promise}
 Register callback function of REST Request.

 #### success Callback
 register callback which is called when REST request succeed

 #### error Callback
 register callback which is called when REST request fail

 * @description
 Send REST request.
 **/
RestManager.prototype.send = function(options){
  var self = this;
  // double submit check.
  if(self.submitFlags[options.url] === "true"){
    self.doubleSubmitErrorHandler();
    return;
  }
  var data = options.data;
  if(!data){
    data = {};
    options.data = data;
  }
  // set 'Post' in Http Method if option.method is null.
  options.method = options.method || 'POST';
  // Add controlParamKey unless Http Method is POST.
  if(self.controlParamKey && options.type === 'POST'){
    data.controlParamKey = self.controlParamKey;
  }

  // set submit flag
  self.submitFlags[options.url] = "true";
  // store send time.
  self.requestTime = new Date().getTime();
  // show loading dialog
  self.loadingOn();

  function always(){
    self.submitFlags[options.url] = "false";
    self.responseTime = new Date().getTime();
    var requestTime = self.responseTime - self.requestTime;
    // hide loding dialog
    self.loadingOff(requestTime);

  }
  return self.ajaxCall(options)
    .success(function(){
      always();
    })
    .error(function(xhr,status){
      self.ajaxErrorHandler(xhr,status);
      always();
    });
};
