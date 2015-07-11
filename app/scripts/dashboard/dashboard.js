/**
 * Created by lijia on 3/12/15.
 */
function DashboardController() {

    this.keyword = "";
    this.hoveredNode = undefined;
    this.hoveredClientX = 0;
    this.hoveredClientY = 0;

    this.minR = 50;
    this.rangeR = 40;
    this.centerX = 100;
    this.centerY = 100;
    this.baseSize = 20;

    this.SigmaGraph = {};

    this.nodes = [];
    this.edges = [];
    this.expandedNodes = [];
    this.selectedNodes = [];
    this.endedNodes = [];

    this.normalColor = '#ec5148';
    this.selectedColor = '#00FF00';
    this.endColor = '#DDDDDD';
}

DashboardController.prototype.onOverNode = function(eventData) {
    var self = this;

    self.hoveredNode = eventData.data.node;
    self.hoveredClientX = eventData.data.captor.clientX;
    self.hoveredClientY = eventData.data.captor.clientY;

    if (self.isExpanded(self.hoveredNode.label)) return;

    $('#expandBtn').css('left', eventData.data.captor.clientX + 10);
    $('#expandBtn').css('top', eventData.data.captor.clientY + 10);
    $('#expandBtn').show();

};

DashboardController.prototype.onOutNode = function(eventData) {
    var self = this;

};

DashboardController.prototype.selectNode = function(node) {
    var self = this;

    self.selectedNodes.push(node);
    node.color = self.selectedColor;

    self.SigmaGraph.refresh();
    self.dispRelatives();
}

DashboardController.prototype.unselectNode = function(node) {
    var self = this;

    for (var i = 0; i < self.selectedNodes.length; i++) {
      if (self.selectedNodes[i] != undefined &&
          node.label === self.selectedNodes[i].label){
        self.selectedNodes[i] = undefined;
      }
    };

    if (self.isEnded(node.label)){
      node.color = self.endColor;
    }else{
      node.color = self.normalColor;
    }

    self.SigmaGraph.refresh();
    self.dispRelatives();
}

DashboardController.prototype.dispRelatives = function() {
  var self = this;

  var txt = "";
  var count = 0;

  for (var i = 0; i < self.selectedNodes.length; i++) {
    if (self.selectedNodes[i] === undefined) continue;

    if (count === 0){
      txt += self.selectedNodes[i].label;
    }else{
      txt +=  ", " + self.selectedNodes[i].label;
    }

    count ++;
  };

  $('#divRelative').text(txt);

}

DashboardController.prototype.onClickNode = function(eventData) {
    var self = this;

    self.hoveredNode = eventData.data.node;
    self.hoveredClientX = eventData.data.captor.clientX;
    self.hoveredClientY = eventData.data.captor.clientY;

    if (self.isSelected(eventData.data.node.label)){
      self.unselectNode(eventData.data.node);
    }else{
      self.selectNode(eventData.data.node);
    }

};

DashboardController.prototype.init = function() {
    var self = this;

    self.SigmaGraph = new sigma({
      graph: {nodes: [], edges: []}
    });

    self.SigmaGraph.settings({
      labelThreshold: 1
    }); 
    
    self.SigmaGraph.addCamera('cam1'),
    self.SigmaGraph.addRenderer({
      container: document.getElementById('divSigma'),
      type: 'canvas',
      camera: 'cam1'
    });

    sigma.renderers.def = sigma.renderers.canvas;
    sigma.plugins.dragNodes(self.SigmaGraph, self.SigmaGraph.renderers[0]);

    self.SigmaGraph.bind('overNode', function(e) {
      self.onOverNode(e);
    });

    self.SigmaGraph.bind('outNode', function(e) {
      self.onOutNode(e);
    });

    self.SigmaGraph.bind('clickNode', function(e) {
      self.onClickNode(e);
    });

    $('#btnFetchKeys').on("click", function() {
      self.search();
    });

    $('#expandBtn').on("click", function() {
      self.expand();
    });

    $('#btnFinalSearch').on("click", function() {

      self.keyword = $('#keyword').val();
      var keys = [self.keyword];

      $.each(self.selectedNodes, function(idx, node){
        if (node != undefined){
          keys.push(node.label);
        } 
      });

      $('#resultWindow').empty();
      $('#resultCount').empty();

      self.getResults(keys).success(function(data){

        $('#resultCount').text( "検索結果：　" + data.hits.total + "件。　（下記はTop10）");

        var hits = data.hits.hits;

        var markup = "<div class='resultItem'><a href='${url}' target='_blank_'>${url}</a><span>{{html summary}}</span></div>";
        $.template("resultList", markup);

        var resultList = [];
        $.each(hits, function(idx, result){
          var resultItem = {};
          resultItem.url = result._id;
          resultItem.summary = "";

          for (var i = 0; i < result.highlight.content.length; i++) {
            resultItem.summary += "......" + result.highlight.content[i] + "...... ";
            if (i > 3) break;
          };

          resultList.push(resultItem);
        });

        $.tmpl("resultList", resultList).appendTo("#resultWindow");

      });

    });

    $('#divSigma').on("mousemove", function(e) {
      self.onMouseMove(e);
    });

    $('#expandBtn').css('position','absolute');
    $('#expandBtn').hide();

};

DashboardController.prototype.onMouseMove = function(eventData) {
    var self = this;

    if (self.hoveredNode === undefined){
      return;
    }else{
      if (65 < self.calcDistance(self.hoveredClientX, self.hoveredClientY, eventData.clientX, eventData.clientY)){
        $('#expandBtn').hide();
        self.hoveredNode = undefined;
      }
    }

};

DashboardController.prototype.calcDistance = function(x1,y1,x2,y2) {
  var xd = x2 - x1;
  var yd = y2 - y1;

  return Math.sqrt((xd * xd ) + (yd * yd));
}

DashboardController.prototype.isExpanded = function(label) {
  var self = this;

  for (var i = 0; i < self.expandedNodes.length; i++) {
    if (label === self.expandedNodes[i].label){
      return true;
    }
  };

  return false;
}

DashboardController.prototype.isEnded = function(label) {
  var self = this;

  for (var i = 0; i < self.endedNodes.length; i++) {
    if (label === self.endedNodes[i].label){
      return true;
    }
  };

  return false;
}

DashboardController.prototype.isSelected = function(label) {
  var self = this;

  for (var i = 0; i < self.selectedNodes.length; i++) {
    if (self.selectedNodes[i] != undefined &&
       label === self.selectedNodes[i].label){
      return true;
    }
  };

  return false;
}

DashboardController.prototype.expand = function() {
    var self = this;

    if (self.isExpanded(self.hoveredNode.label)) return;

    self.getTerms(self.hoveredNode.label).success(function (data){

      if (data.aggregations.most_sig.buckets.length === 0){
        if (!self.isSelected(self.hoveredNode.label)){
          self.hoveredNode.color = self.endColor;
        }
        self.endedNodes.push(self.hoveredNode);
      }else{
        self.addNodes(self.hoveredNode, data.aggregations.most_sig.buckets);
      }

      self.SigmaGraph.refresh();

      $('#expandBtn').hide();

      self.expandedNodes.push(self.hoveredNode);

    });

};

DashboardController.prototype.getResults = function(keywords) {
    var self = this;

    return RestManagerSingleton.getInstance().send({
      method:'POST',
      url:'http://52.8.222.228:9200/demo/_search?pretty=true ',
      data:'{"query": {"terms" : { "content" : ' + JSON.stringify(keywords) + '} }, '+
          '"size": 10, ' +
          '"highlight" : {"fields" : {"content" : {}}}}'
    });
};

DashboardController.prototype.getTerms = function(keyword) {
    var self = this;
    return RestManagerSingleton.getInstance().send({
      method:'POST',
      url:'http://52.8.222.228:9200/demo/_search?search_type=count&pretty=true ',
      data:'{"query": {"term" : { "content" : "' + keyword + '"} }, '+
          '"size": 0, '+
          '"aggs": { '+
          '  "most_sig": { '+
          '    "significant_terms": {  '+
          '      "field": "content", '+
          '      "size": ' + 16 + '}}}}'
    });
};

DashboardController.prototype.findNode = function(label) {
  var self = this;

  for (var i = 0; i < self.nodes.length; i++) {
    if (label === self.nodes[i].label){
      return self.nodes[i];
    }
  };

  return undefined;
};

DashboardController.prototype.findEdge = function(source, target) {
  var self = this;

  for (var i = 0; i < self.edges.length; i++) {
    if ((source === self.edges[i].source && target === self.edges[i].target) ||
        (target === self.edges[i].source && source === self.edges[i].target)){
      return self.edges[i];
    }
  };

  return undefined;
};

DashboardController.prototype.addNodes = function(centerNode, terms) {
    var self = this;

    var centerX, centerY;
    var nodeIdRoot, edgeIdRoot;

    if (centerNode === undefined){

      centerNode = {
          id: 'n' + 0,
          label: self.keyword,
          x: self.centerX,
          y: self.centerY,
          size: self.baseSize * 8,
          color: self.normalColor
      };
      self.SigmaGraph.graph.addNode(centerNode);
      self.nodes.push(centerNode);
      self.expandedNodes.push(centerNode);

      centerX = self.centerX;
      centerY = self.centerY;
      nodeIdRoot = "n";
      edgeIdRoot = "e";
    }else{
      centerX = centerNode.x;
      centerY = centerNode.y;
      nodeIdRoot = centerNode.id + "_";
      edgeIdRoot = "e_" + centerNode.id + "_";
    }

    var total_count = terms.length;
    var angleunit = (360 / total_count )* Math.PI /180;

    for (var i = 0; i < terms.length; i++) {
      
      if (centerNode.label === terms[i].key){
        continue;
      }

      var dupNode = self.findNode(terms[i].key);
      if (dupNode != undefined){

        var dupEdge = self.findEdge(dupNode.id, centerNode.id);

        if (dupEdge === undefined){
          self.SigmaGraph.graph.addEdge({
            id: edgeIdRoot + i,
            source: centerNode.id,
            target: dupNode.id,
            size: 3,
            color: self.normalColor
          });
        }

        continue;
      }

      var randomR = Math.random() * self.rangeR + self.minR;
      var newNode = {
        id: nodeIdRoot + (i + 1),
        label: terms[i].key,
        x: centerX + Math.cos(i*angleunit) * randomR,
        y: centerY + Math.sin(i*angleunit) * randomR,
        size: self.baseSize * terms[i].score * 2,
        color: self.normalColor
      };
      self.nodes.push(newNode);
      self.SigmaGraph.graph.addNode(newNode);

      var newEdge = {
        id: edgeIdRoot + i,
        source: centerNode.id,
        target: nodeIdRoot + (i + 1),
        size: 3,
        color: self.normalColor
      };
      self.edges.push(newEdge);
      self.SigmaGraph.graph.addEdge(newEdge);

    };
};

DashboardController.prototype.search = function() {
    var self = this;

    self.keyword = $('#keyword').val();

    self.getTerms(self.keyword).success(function (data){
      
      self.SigmaGraph.graph.clear();

      self.nodes = [];
      self.edges = [];
      self.expandedNodes = [];
      self.selectedNodes = [];
      self.endedNodes = [];

      self.addNodes(undefined, data.aggregations.most_sig.buckets);

      self.SigmaGraph.refresh();
      self.dispRelatives();

    });
};

