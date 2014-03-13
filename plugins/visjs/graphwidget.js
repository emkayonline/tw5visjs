/*\
title: $:/plugins/emkay/visjs/graphwidget.js
type: application/javascript
module-type: widget

  A widget for displaying graphs using Vis.js.  http://visjs.org

  For full help see $:/plugins/emkay/visjs/help

\*/

/*jslint node: true, browser: true */
/*global $tw: false */

(function() {
  'use strict';

  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  var moment = require("$:/plugins/emkay/visjs/moment.js").moment;
  var vis = require("$:/plugins/emkay/visjs/vis.js").vis;

  var backlinksFilter = $tw.wiki.compileFilter("[is[current]backlinks[]]");
  var linksFilter = $tw.wiki.compileFilter("[is[current]links[]]");
  var listFilter = $tw.wiki.compileFilter("[is[current]list[]]");
  var listedFilter = $tw.wiki.compileFilter("[is[current]listed[]]");
  var tagsFilter = $tw.wiki.compileFilter("[is[current]tags[]]");
  var taggingFilter = $tw.wiki.compileFilter("[is[current]tagging[]]");

  var GraphWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
  };

  GraphWidget.prototype = new Widget();

  GraphWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    var dm = $tw.utils.domMaker;
    this.errorDiv = dm("div",{document: this.document, "class": "widget-error"});
    parent.insertBefore(this.errorDiv,nextSibling);
    this.domNodes.push(this.errorDiv);

    var attrParseWorked = this.execute();
    if (attrParseWorked === undefined) {
      var graphHolder = this.document.createElement("div");
      parent.insertBefore(graphHolder,nextSibling);
      this.domNodes.push(graphHolder);
      this.createGraph(graphHolder);
    } else {
      this.errorDiv.innerHTML = this.parseTreeNode.type+": Unexpected attribute(s) "+attrParseWorked.join(", ");
      this.refresh = function() {}; // disable refresh of this as it won't work with incorrrect attributes
    }
  };


  GraphWidget.prototype.parseWidgetAttributes = function(attributeDefns) {
    var errors = [];
    for (var attr in this.attributes) {
      if (attributeDefns[attr] === undefined) {
        errors.push(attr);
      } else {
        this[attr] = this.attributes[attr];
      }
    }
    if (errors.length !== 0) {
      return errors;
    }
    for (var attrDefn in attributeDefns) {
      if (this[attrDefn] === undefined) {
        this[attrDefn] = attributeDefns[attrDefn].defaultValue;
      }
    }
    return undefined;
  };

  GraphWidget.prototype.execute = function() {
    var attrParseWorked = this.parseWidgetAttributes({
           tiddler:       {   type: "string", defaultValue: this.getVariable("currentTiddler")}
           // options:  { type: "flags", defaultValue: undefined}
            });

    return attrParseWorked;
  };

  function addNodes(compiledFilter, linkType, currTiddlerTitle, nodeSetAndEdges, depth, maxDepth) {
    var tiddlers = compiledFilter.call(null, null, currTiddlerTitle);
    tiddlers.forEach(function(entry) {
        nodeSetAndEdges = buildNodeSetAndEdges(nodeSetAndEdges, currTiddlerTitle, linkType, entry, depth+1, maxDepth);
    });
  }
  // Types
  // Tagging "[is[current]tagging[]]"
  // Backlinks "[is[current]backlinks[]]"
  // Forward links (through tag) "[is[current]tags[]]"
  // 
  // Do we want to do list and listed
  //
  // Also, what about doing an arbitraty graph? (Of heirarchical data)
  //
  // Encoding:
  // normal tiddlers
  // missing tiddlers
  // tags
  // system tiddlers
  // Shadow tiddlers
  //
  function buildNodeSetAndEdges(nodeSetAndEdges, fromTiddler, linkType, currTiddlerTitle, depth, maxDepth) {
    if (nodeSetAndEdges.nodeSet.hasOwnProperty(currTiddlerTitle) || (depth > maxDepth)) {
      return nodeSetAndEdges;
    }
    // http://visjs.org/examples/graph/04_shapes.html
    nodeSetAndEdges.nodeSet[currTiddlerTitle] = {id: currTiddlerTitle, label: currTiddlerTitle, shape: "elipse"};
    var toTiddler = $tw.wiki.getTiddler(currTiddlerTitle);
    if (toTiddler === undefined) {
      nodeSetAndEdges.nodeSet[currTiddlerTitle].shape = "triangle";
    } else {
      nodeSetAndEdges.nodeSet[currTiddlerTitle].color = toTiddler.fields.color;
    }
    if (fromTiddler !== null) {
      nodeSetAndEdges.edges.push( {from: fromTiddler, to: currTiddlerTitle, label: linkType, style: "arrow"} );
    } else {
      nodeSetAndEdges.nodeSet[currTiddlerTitle].shape = "box";
    }

    // Forward links
    addNodes(linksFilter, "link", currTiddlerTitle, nodeSetAndEdges, depth, maxDepth);
    // Forward links though list
    addNodes(listFilter, "list", currTiddlerTitle, nodeSetAndEdges, depth, maxDepth);
    // Forward links though tag
    addNodes(tagsFilter, "tag", currTiddlerTitle, nodeSetAndEdges, depth, maxDepth);
    // Backlinks
    addNodes(backlinksFilter, "backlink", currTiddlerTitle, nodeSetAndEdges, depth, maxDepth);
    // Backlinks though listed
    addNodes(taggingFilter, "listed", currTiddlerTitle, nodeSetAndEdges, depth, maxDepth);
    // Backlinks though tags
    addNodes(taggingFilter, "tagging", currTiddlerTitle, nodeSetAndEdges, depth, maxDepth);
    return nodeSetAndEdges;
  }

  function displayTiddler(self,toTiddlerTitle,fromTiddlerTitle){
    var bounds = self.domNodes[0].getBoundingClientRect();
    var e = {
      type: "tw-navigate",
      navigateTo: toTiddlerTitle,
      navigateFromTitle: fromTiddlerTitle,
      navigateFromClientRect: { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
      }
    };
    self.dispatchEvent(e);
  }

  GraphWidget.prototype.createGraph = function(holderDiv) { 

    var tiddlers = $tw.wiki.filterTiddlers("[is[current]listed[]]","TiddlerFour");
    console.log(tiddlers);
    tiddlers = $tw.wiki.filterTiddlers("[listed[TiddlerFour]]","TiddlerFour");
    console.log(tiddlers);
    var tiddlers = $tw.wiki.filterTiddlers("[is[current]list[]]","TiddlerOne");
    console.log(tiddlers);
    tiddlers = $tw.wiki.filterTiddlers("[list[TiddlerOne]]","TiddlerOne");
    console.log(tiddlers);
    var nodeSetAndEdges = buildNodeSetAndEdges({nodeSet: {}, edges: []},null, null, this.tiddler,1,5);

    var nodes = [];
    for (var key in nodeSetAndEdges.nodeSet) {
      if (nodeSetAndEdges.nodeSet.hasOwnProperty(key)) {
        nodes.push(nodeSetAndEdges.nodeSet[key]);
      }
    }
    
    console.log(nodes);
    var data= {
      nodes: nodes,
      edges: nodeSetAndEdges.edges,
    };
    var options = {};
    // this.document === $tw.fakeDocument for test mode
    if (this.parentWidget.parentWidget.mockGraph === undefined) {
      this.graph = new vis.Graph(holderDiv, data, options);
    } else {
      this.graph = this.parentWidget.parentWidget.mockGraph;
    }
    var self = this;
    this.graph.on('doubleClick', function(properties) {
      // Check if background or a tiddler is selected
      if (properties.nodes.length !== 0) {
        self.tiddler = properties.nodes[0];
        self.createGraph(holderDiv);
      }
    });
    this.graph.on('click', function(properties) {
      // Check if background or a tiddler is selected
      if (properties.nodes.length !== 0) {
        var toTiddlerTitle = properties.nodes[0];
        var fromTiddlerTitle = self.getVariable("currentTiddler");
        displayTiddler(self, toTiddlerTitle, fromTiddlerTitle);
      }
    });
  };


  exports.visjsgraph = GraphWidget;

  }
  ());
