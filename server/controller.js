/**
 * Created by xukai on 7/14/15.
 */
var querystring = require("querystring");
var Client = require('ssh2').Client;
var self = this;
var buffer = [];
var running = false;
var max_return_lines = 100;
var max_stored_lines = 1000;
var progress = {};
var keypath = "/Users/xukai/aws/ubkeypair.pem"


function getStage(maxFetch) {
  return { "stages" : [
    {
      "name" : "Inject",
      "seq" : 1,
      "stats" : "-----",
      "mark" : "Injector: finished"
    },
    {
      "name" : "Generate",
      "seq" : 2,
      "stats" : "-----",
      "mark" : "Generator: finished"
    },
    {
      "name" : "Fetch",
      "seq" : 3,
      "stats" : " 0% ",
      "mark" : "fetchQueues.totalSize=",
      "max" : maxFetch
    },
    {
      "name" : "Parse",
      "seq" : 4,
      "stats" : "-----",
      "mark" : "ParseSegment: finished"
    },
    {
      "name" : "Update",
      "seq" : 5,
      "stats" : "-----",
      "mark" : "CrawlDb update: finished"
    },
    {
      "name" : "LinkDB",
      "seq" : 6,
      "stats" : "-----",
      "mark" : "LinkDb: finished"
    },
    {
      "name" : "Index",
      "seq" : 7,
      "stats" : "-----",
      "mark" : "Indexer: finished"
    }
  ]};
}

function updateStage(line, stageInfo){
  for (var i = 0; i < stageInfo.stages.length; i++) {
    var stage = stageInfo.stages[i];

    if (stage.seq === 3){
      var pos = line.indexOf(stage.mark);
      if (pos >=0){
        var start = pos+stage.mark.length;
        var number = line.substring(start, line.indexOf(',', pos));
        if (number ===0){
          stage.stats = "finished";
        }else{
          stage.stats = Math.round(((stage.max - number)*100)/stage.max) + "%";
        }

        break;
      }
    }else{
      if (line.substring(0, stage.mark.length) === stage.mark){
        stage.stats = "finished";
        break;
      }
    }
  };

  return stageInfo;
}


function home(response, postData) {
  response.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin":"*"});
	response.write("I am alive!");
	response.end();
}

function response(response, data){

  response.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin":"*"});
  response.write(JSON.stringify(data));
  response.end();
}

function check(response, postData) {

  var conn = new Client();

  conn.on('ready', function() {
    console.log('Client :: ready');
    conn.shell(function(err, stream) {
      if (err) self.response(response, {"status" : "error", "err" : err });
      stream.on('close', function() {
        conn.end();
        self.response(response, {"status" : "alive"});
      }).on('data', function(data) {
      }).stderr.on('data', function(data) {
        self.response(response, {"status" : "error", "err" : data});
      });

      stream.end("\nexit\n");
    });
  }).on('error', function(err){
    self.response(response, {"status" : "error", "err" : err });
  }).connect({
    host: querystring.parse(postData).host,
    port: 22,
    username: 'ubuntu',
    privateKey: require('fs').readFileSync(keypath)
  });

}

function start(response, postData) {

  var conn = new Client();
  var strBuffer = '';
  var workFolder = "apache-nutch-1.10/runtime/local";
  var topN = querystring.parse(postData).topN;
  var host = querystring.parse(postData).host;

  conn.on('ready', function() {
    console.log('Client :: ready');
    conn.shell(function(err, stream) {
      if (err) {
        buffer.push('error:', '' + err);
        running = false;
      }
      stream.on('close', function() {
        buffer.push('finished');
        conn.end();
        running = false;
      }).on('data', function(data) {
        strBuffer += '' + data;
        var arrResult = strBuffer.split('\n');
        if (arrResult.length > 1){
          for (var i = 0; i < arrResult.length - 1; i++) {
            while (buffer.length >= max_stored_lines){
              buffer.shift();
            }
            buffer.push(arrResult[i].replace('\r',''));
          };
          strBuffer = arrResult[arrResult.length - 1];
        }

      }).stderr.on('data', function(data) {
        buffer.push('error:', '' + data);
        running = false;
      });

      var cmdList = "";
      cmdList += "cd " + workFolder + "\n";
      cmdList += "bin/nutch inject car/crawldb urls\n";
      cmdList += "bin/nutch generate car/crawldb car/segments -topN " + topN + "\n";
      cmdList += "s1=`ls -d car/segments/2* | tail -1`\n";
      cmdList += "echo $s1\n";
      cmdList += "bin/nutch fetch $s1\n";
      cmdList += "bin/nutch parse $s1\n";
      cmdList += "bin/nutch updatedb car/crawldb $s1\n";
      cmdList += "bin/nutch invertlinks car/linkdb $s1\n";
      cmdList += "bin/nutch index car/crawldb -linkdb car/linkdb $s1\n";
      cmdList += "exit\n";

      stream.end(cmdList);
      running = true;

      progress[host] = self.getStage(topN);
      self.response(response, {"status" : "started"});
    });
  }).on('error', function(err){
    self.response(response, {"status" : "error", "err" : err});
    running = false;
  }).connect({
    host: host,
    port: 22,
    username: 'ubuntu',
    privateKey: require('fs').readFileSync(keypath)
  });
}

function display(response, postData) {
  var returned = [];
  var host = querystring.parse(postData).host;

  while(buffer.length > 0 ) {
    var line = buffer.shift();
    progress[host] = self.updateStage(line, progress[host]);
    // for debug
    console.log(line);
  };
  self.response(response, {"status" : running ? "running" : "finished", "progress" : progress[host]});
}

function stop(response, postData) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("TODO: stop");
    response.end();
}

function stats(response, postData) {

  var conn = new Client();
  var strBuffer = '';
  var regxPrefix = '+^http://([a-z0-9]*\\.)*';
  var staticsPrefix = "CrawlDb statistics";
  var filterFile = 'conf/regex-urlfilter.txt';
  var workFolder = "apache-nutch-1.10/runtime/local";

  conn.on('ready', function() {
    console.log('Client :: ready');
    conn.shell(function(err, stream) {
      if (err) self.response(response, {"status" : "error", "err" : err });
      stream.on('close', function() {

        var resultStatics = [];
        var resultDomains = [];
        var lst = strBuffer.split('\n');
        var isStatics = false;
        for (var i = 0; i < lst.length; i++) {
          element = lst[i];

          if (element.substring(0, staticsPrefix.length) === staticsPrefix ){
            if (isStatics){
              isStatics = false;
            }else{
              isStatics = true;
            }
          }

          if (isStatics && element.substring(0, staticsPrefix.length) != staticsPrefix){
            resultStatics.push(element);
          }

          if (element.substring(0, regxPrefix.length) === regxPrefix ){
            resultDomains.push(element.replace(regxPrefix, '').replace('/',''));
          }
        };

        self.response(response, {
          "status" : "Refreshed",
          "statics" : resultStatics,
          "domains" : resultDomains
        });

        conn.end();
      }).on('data', function(data) {
        strBuffer += '' + data;
      }).stderr.on('data', function(data) {
        self.response(response, {"status" : "error", "err" : data });
      });

      var cmdList = "";
      cmdList += "cd " + workFolder + "\n";
      cmdList += "cat " + filterFile + "\n";
      cmdList += "bin/nutch readdb car/crawldb -stats\n";
      cmdList += "exit\n";

      stream.end(cmdList);
    });
  }).on('error', function(err){
    self.response(response, {"status" : "error", "err" : err });
  }).connect({
    host: querystring.parse(postData).host,
    port: 22,
    username: 'ubuntu',
    privateKey: require('fs').readFileSync(keypath)
  });
}

function modify(response, postData) {

  var conn = new Client();

  var strBuffer = '';
  var regxDel = '+^http:';
  var seedFile = 'urls/seeds.txt';
  var filterFile = 'conf/regex-urlfilter.txt';
  var workFolder = "apache-nutch-1.10/runtime/local";

  var domains = JSON.parse(querystring.parse(postData).domains);

  conn.on('ready', function() {
    console.log('Client :: ready');
    conn.shell(function(err, stream) {
      if (err) self.response(response, {"status" : "error", "err" : err });
      stream.on('close', function() {
        console.log('Stream :: closed--------------');
        conn.end();
        self.response(response, {"status" : "modified"});
      }).on('data', function(data) {
        strBuffer += '' + data;
        //--beautify log--
        var arrResult = strBuffer.split('\n');
        if (arrResult.length > 1){
          for (var i = 0; i < arrResult.length - 1; i++) {
            console.log(arrResult[i].replace('\r',''));
          };
          strBuffer = arrResult[arrResult.length - 1];
        }
        //----------------
      }).stderr.on('data', function(data) {
        self.response(response, {"status" : "error", "err" : data });
      });
      
      var cmd = "";
      cmd += "cd " + workFolder + "\n";
      cmd += "sed -i '/" + regxDel + "/,$d' " + filterFile + "\n";
      for (var i = 0; i < domains.length; i++) {
        cmd += "sed -i '$ a\\+^http://([a-z0-9]*\\\\.)*" + domains[i].domain.replace('\r','') + "/' " + filterFile + "\n";
      };

      //cmd += "sed -i '/http/,$d' " + seedFile + "\n";
      //for (var i = 0; i < domains.length; i++) {
      //  cmd += "sed -i '$ a\\http://" + domains[i].domain.replace('\r','') + "/' " + seedFile + "\n";
      //};

      cmd += "rm " + seedFile + "\n";
      cmd += "echo -e ";
      for (var i = 0; i < domains.length; i++) {
        cmd += "http://" + domains[i].domain.replace('\r','') + "\\\\n";
      };
      cmd += " >> " + seedFile + "\n";;
      cmd += "exit\n";

      stream.end(cmd);
    });
  }).on('error', function(err){
    self.response(response, {"status" : "error", "err" : err });
  }).connect({
    host: querystring.parse(postData).host,
    port: 22,
    username: 'ubuntu',
    privateKey: require('fs').readFileSync(keypath)
  });
}

exports.home = home;
exports.check = check;
exports.start = start;
exports.display = display;
exports.stop = stop;
exports.stats = stats;
exports.modify = modify;
exports.response = response;
exports.getStage = getStage;
exports.updateStage = updateStage;

