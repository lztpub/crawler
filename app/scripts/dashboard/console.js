/**
 * Created by xukai on 7/14/15.
 */
function ConsoleController() {

  this.hosts=[
    {
      "host":"52.8.90.3",
      "name":"Nutch_01",
      "status":"Unchecked"
    },
    {
      "host":"52.8.208.245",
      "name":"Nutch_02",
      "status":"Unchecked"
    },
    {
      "host":"52.8.101.101",
      "name":"Nutch_dummy",
      "status":"Unchecked"
    }];

    this.addDomainMsg = '＜ドメインを追加する＞';
    this.apServer = 'localhost:6600';
    this.max_disp_lines = 1000;
    this.esServer = '52.8.222.228:9200';
}

ConsoleController.prototype.init = function() {
  var self = this;

  var markup = "<div id='i_${tag}' class='hostItem'><span class='hostName'>Node : ${tag}</span>";
  markup += "<span class='hostIP'>${ip}</span>";
  markup += "<span id='h_${tag}' class='hostStatus'>${status}</span>";
  markup += "<span id='b_${tag}' class='hostButton'>Check</span>";
  markup += "<span id='v_${tag}' class='hostButton'>View>></span></div>";

  $.template("hostList", markup);

  var hostList = [];
  $.each(self.hosts, function(idx, host){
    var hostItem = {};
    hostItem.tag = host.name;
    hostItem.ip = host.host;
    hostItem.status = host.status;

    hostList.push(hostItem);
  });

  $.tmpl("hostList", hostList).appendTo("#hostlist");

  $.each(hostList, function(idx, item){
    $('#b_' + item.tag).on("click", function() {

      $('#h_' + item.tag).text("checking...");
      self.checkStatus(item);

    });

    $('#v_' + item.tag).on("click", function() {

      self.getStatics(item);
    });

  });

  $('#btnTest').on("click", function() {
    self.search();
  });

  $('#editDomainDiv').hide();
  $('#crawlstats').hide();
  $('#domains').hide();
  $('#divcompare').hide();
  $('#divbefore').text('--');
  $('#divafter').text('--');
  $('#editDomain').val('');
  // default number for demo
  $('#editTopN').val(20);
};

ConsoleController.prototype.checkStatus = function(host) {
  var self = this;

  RestManagerSingleton.getInstance().send({
    method:'POST',
    url:'http://'+ self.apServer + '/check',
    data: {"host": host.ip}
  }).success(function (data){
    // update the status display
    $('#h_' + host.tag).text(JSON.parse(data).status);    
  });
};

ConsoleController.prototype.getStatics = function(host) {
  var self = this;
  $('#crawlstats').empty();
  $('#domains').empty();
  $('#h_' + host.tag).text("opening...");    
  $('#editDomain').val('');
  $('#divbefore').text('--');
  $('#divafter').text('--');

  RestManagerSingleton.getInstance().send({
    method:'POST',
    url:'http://'+ self.apServer + '/stats',
    data: {"host": host.ip}
  }).success(function (data){
    var result = JSON.parse(data);

    // update the status display
    $('#h_' + host.tag).text(JSON.parse(data).status);    
    $('#startCrawl').off("click");

    if (JSON.parse(data).status != "error"){

      $('#editDomainDiv').show();
      $('#crawlstats').show();
      $('#domains').show();
      $('#divcompare').show();

      // List stats
      $.template("statList", "<span class='crawlstat'>${stat}</span>");
      var statList = [];
      $.each(result.statics, function(idx, stat){
        statList.push({"stat" : stat});
      });
      $.tmpl("statList", statList).appendTo("#crawlstats");

      // add a new line for adding domain
      result.domains.push(self.addDomainMsg);
      // List domains
      $.template("domainList", "<span id='d_${idx}' class='domainspan'>${domain}</span>");
      var domainList = [];
      $.each(result.domains, function(idx, domain){
        domainList.push({"domain" : domain, "idx" : idx});
      });
      $.tmpl("domainList", domainList).appendTo("#domains");

      // handler for adding domain
      var addDomain = function(e){
        var oldDomain = e.data.d;
        var newDomain = {"domain" : self.addDomainMsg, "idx" : domainList.length};
        // modify the domain to page and domainList
        oldDomain.domain = $('#editDomain').val().replace('\r','');
        $('#d_' + oldDomain.idx).text(oldDomain.domain);
        // add new domain to page and domainList
        domainList.push(newDomain);
        $.template("domainList", "<span id='d_${idx}' class='domainspan'>${domain}</span>");
        $.tmpl("domainList", [newDomain]).appendTo("#domains");
        // atatch handle to new item
        $('#d_' + newDomain.idx).on("click", {d : newDomain}, onClickDomain);
        $('#applyDomain').off("click");
        // refresh handle of the add button
        $('#applyDomain').on("click", {d : newDomain}, addDomain);
      };

      // handler for changing domain
      var changeDomain = function(e){
        e.data.d.domain = $('#editDomain').val().replace('\r','');
        $('#d_' + e.data.d.idx).text(e.data.d.domain);
      };

      var delDomain = function(e){
        domainList.splice(domainList.indexOf(e.data.d), 1);
        document.getElementById("domains").removeChild(document.getElementById('d_' + e.data.d.idx));
        $('#deleteDomain').off("click");
        $('#editDomain').val("");
      };

      // handler for clicking the domain line
      var onClickDomain = function(e){
        var domain = e.data.d;
        $('#applyDomain').off("click");
        $('#deleteDomain').off("click");
        if (domain.domain === self.addDomainMsg){
          $('#editDomain').val("");
          $('#applyDomain').text("追加");
          $('#applyDomain').on("click", {d : domain}, addDomain);
        }else{
          $('#editDomain').val(domain.domain);
          $('#applyDomain').text("更新");
          $('#applyDomain').on("click", {d : domain}, changeDomain);
          $('#deleteDomain').on("click", {d : domain}, delDomain);
        }
        $('#editDomain').focus();
      };

      // Add events for each domain line
      $.each(domainList, function(idx, domain){
        //start edit
        $('#d_' + domain.idx).on("click", {d:domain} ,onClickDomain);
      });
      $('#applyDomain').on("click", {d : domainList[domainList.length-1]}, addDomain);

      $('#confirmDomains').off("click");
      $('#confirmDomains').on("click", {l:domainList}, function(e){
        if (domainList[domainList.length-1].domain === self.addDomainMsg){
          domainList.pop();
        }
        self.confirmDomains(host, domainList);
      });

      $('#startCrawl').on("click", {h:host} ,function(e){

        self.startCrawl(e.data.h, $('#editTopN').val());
      });

    };

  });
};

ConsoleController.prototype.confirmDomains = function(host, domainList) {
  var self = this;
  $('#h_' + host.tag).text("config...");    

  RestManagerSingleton.getInstance().send({
    method:'POST',
    url:'http://'+ self.apServer + '/modify',
    data: {"host": host.ip, "domains" : JSON.stringify(domainList) }
  }).success(function (data){
    $('#h_' + host.tag).text(JSON.parse(data).status);    
    self.getStatics(host);
  });
};

ConsoleController.prototype.startCrawl = function(host, topN) {
  var self = this;
  $('#divbefore').text('--');
  $('#divafter').text('--');

  self.getIndexAmount().success(function(data){
    $('#divbefore').text(data.hits.total);

    RestManagerSingleton.getInstance().send({
      method:'POST',
      url:'http://'+ self.apServer + '/start',
      data: {"host": host.ip, "topN" : topN }
    }).success(function (data){
      $('#h_' + host.tag).text(JSON.parse(data).status);
      setTimeout(function(){
        self.displayCrawl(host);
      }, 200);
    });

  });
};

ConsoleController.prototype.getIndexAmount = function(  ) {
    var self = this;
    return RestManagerSingleton.getInstance().send({
      method:'POST',
      url:'http://' +self.esServer+'/demo/_search?search_type=count&pretty=true',
      data:'{"query": {"matchAll" : {} }, "size": 0}'
    });
};

ConsoleController.prototype.displayCrawl = function(host) {
  var self = this;

  RestManagerSingleton.getInstance().send({
    method:'POST',
    url:'http://'+ self.apServer + '/display',
    data: {"host": host.ip}
  }).success(function (data){
    var result = JSON.parse(data);
    $('#h_' + host.tag).text(result.status);

    $("#progress").empty();
    $.template("prog", "<span class='progressItem'>${name} ${stats}</span>");
    $.tmpl("prog", result.progress.stages).appendTo("#progress");

    if (result.status === "finished"){
      self.getIndexAmount().success(function(data){
        $('#divafter').text(data.hits.total);
      });
    }else{
      setTimeout(function(){
        self.displayCrawl(host);
      }, 500);
    }
  });

};


