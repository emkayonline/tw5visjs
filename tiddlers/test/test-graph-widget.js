/*\
title: test-graph-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the visjs graph widget wrapper (This does not use the visjs graph, but uses a spy for testing)

\*/
(function(){

  'use strict';
  /*jslint node: true, browser: true */
  /*global $tw: false, describe: false, beforeEach: false, jasmine: false, it: false, expect:false */

  var wiki;
  if (!$tw.browser) {
    // Don't run tests if in browser (as we rely on loadTiddersNode)
    describe("vis.js Graph Widget module", function() {

      var widgetNode, wrapper, mockGraph;

      beforeEach(function () {
        $tw.loadWikiTiddlers($tw.boot.wikiPath);
        wiki = $tw.wiki;
      });


      var widget = require("$:/core/modules/widgets/widget.js");

      function createWidgetNode(parseTreeNode) {
        widgetNode	= new widget.widget(parseTreeNode,{
          wiki: wiki,
                    document: $tw.fakeDocument
          // variables: {currentTiddler: "TiddlerOne"}
        });
        mockGraph = jasmine.createSpyObj('mockGraph', ['on', 'setData']);
        widgetNode.mockGraph = mockGraph;
      }

      function parseText(text,options) {
        var parser = wiki.parseText("text/vnd.tiddlywiki",text,options);
        return parser ? {type: "widget", children: parser.tree} : undefined;
      }

      function renderWidgetNode() {
        $tw.fakeDocument.setSequenceNumber(0);
        wrapper = $tw.fakeDocument.createElement("div");
        widgetNode.render(wrapper,null);
      }

      function createAndRenderWidgetNode(text, options) {
        createWidgetNode(parseText(text,options));
        // Render the widget node to the DOM
        renderWidgetNode(widgetNode);
      }

      function refreshWidgetNode(changes) {
        var f;
        // Reset all the spy functions before propgating the changes
        for (f in widgetNode.mockGraph) {
          if (widgetNode.mockGraph.hasOwnProperty(f)){  
            widgetNode.mockGraph[f].reset();
          }
        }
        var changedTiddlers = {};
        if(changes) {
          $tw.utils.each(changes,function(title) {
            changedTiddlers[title] = true;
          });
        }
        widgetNode.refresh(changedTiddlers,wrapper,null);
      }

      // Pick up default tiddler
      // Use defined tiddler
      // Check options
      // Check rendering/colours etc
      // Missing start tiddler
      // Test link loop (one -> two -> one, but not if inverse relationship)
      it("should report unexpected attributes", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjsgraph madeUpAttr="fred"/>');
        // Test the rendering
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjsgraph: Unexpected attribute(s) madeUpAttr</div></p>");
        expect(mockGraph.setData).not.toHaveBeenCalled();
        // Change the included tiddler
        wiki.addTiddler({title: "TiddlerOne", text: "World-wide Jelly"});
        // Refresh
        wiki.addTiddler({title: "TiddlerTwo", created: new Date(2014,2,15), modified: new Date(2014,2,31), text: "More stuff"});
        refreshWidgetNode(["TiddlerTwo"]);
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjsgraph: Unexpected attribute(s) madeUpAttr</div></p>");
        expect(mockGraph.setData).not.toHaveBeenCalled();
      });

      it("should render from AListTiddler", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjsgraph tiddler="AListTiddler" maxDepth="2"/>');
        // Test the rendering
        expect(mockGraph.setData).toHaveBeenCalledWith(
          { nodes : [ { id : 'AListTiddler', label : 'AListTiddler', shape : 'circle', color : 'DodgerBlue' },
            { id : 'TiddlerTwo', label : 'TiddlerTwo', shape : 'elipse' },
          { id : 'TiddlerOne', label : 'TiddlerOne', shape : 'elipse' } ,
          { id : '$:/DefaultTiddlers', label : '$:/DefaultTiddlers', shape : 'box', color : "Gainsboro" } ],
          edges : [ { from : 'AListTiddler', to : 'TiddlerTwo', style : 'arrow' , width: 1},
          { from : 'AListTiddler', to : 'TiddlerOne', style : 'arrow', width: 1 },
          { from : 'AListTiddler', to : '$:/DefaultTiddlers', style : 'arrow', width: 1 },
          ] });
        expect(mockGraph.on).toHaveBeenCalled();
      });

      it("should render from TiddlerThree", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjsgraph tiddler="TiddlerThree" maxDepth="2"/>');
        // Test the rendering
        expect(mockGraph.setData).toHaveBeenCalledWith(
          { nodes : [ { id : 'TiddlerThree', label : 'TiddlerThree', shape : 'circle', color : 'DodgerBlue'  },
            { id : 'testTiddler', label : 'testTiddler', shape : 'triangle' },
            { id : 'TiddlerOne', label : 'TiddlerOne', shape : 'elipse' } ],
          edges : [
        { from : 'TiddlerThree', to : 'testTiddler', style : 'arrow-center', width: 1 },
        { from : 'TiddlerOne', to : 'TiddlerThree', style : 'arrow-center', width: 1 } ] });
        expect(mockGraph.on).toHaveBeenCalled();
      });

      it("should render from MissingTiddler", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjsgraph tiddler="MissingTiddler" maxDepth="2"/>');
        // Test the rendering
        expect(mockGraph.setData).toHaveBeenCalledWith(
          { nodes : [ { id : 'MissingTiddler', label : 'MissingTiddler', shape : 'triangle' },
            { id : 'TiddlerOne', label : 'TiddlerOne', shape : 'elipse' } ],
          edges : [ { from : 'TiddlerOne', to : 'MissingTiddler', style : 'arrow', width: 2 } ] });
        expect(mockGraph.on).toHaveBeenCalled();
      });

      it("should render from TiddlerFour", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjsgraph tiddler="TiddlerFour" maxDepth="2"/>');
        // Test the rendering
        expect(mockGraph.setData).toHaveBeenCalledWith(
          {nodes : [ { id : 'TiddlerFour', label : 'TiddlerFour', shape : 'circle', color : 'Orange' },
            { id : 'testTiddler', label : 'testTiddler', shape : 'triangle' },
           { id : 'TiddlerTwo', label : 'TiddlerTwo', shape : 'elipse' },
           { id : 'TiddlerOne', label : 'TiddlerOne', shape : 'elipse' } ],
           edges : [
        { from : 'TiddlerFour', to : 'testTiddler', style : 'arrow-center', width: 1 },
        { from : 'TiddlerTwo', to : 'TiddlerFour', style : 'arrow', width: 2 },
           { from : 'TiddlerOne', to : 'TiddlerFour', style : 'arrow', width: 1 } ] });
        expect(mockGraph.on).toHaveBeenCalled();
      });

      it("should render from TiddlerTwo", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjsgraph tiddler="TiddlerTwo" maxDepth="2"/>');
        // Test the rendering
        expect(mockGraph.setData).toHaveBeenCalledWith(
          { nodes : [ { id : 'TiddlerTwo', label : 'TiddlerTwo', shape : 'circle', color : 'DodgerBlue'  },
            { id : 'TiddlerFour', label : 'TiddlerFour', shape : 'elipse', color : 'Orange' },
            { id : 'testTiddler', label : 'testTiddler', shape : 'triangle' },
          { id : 'TiddlerOne', label : 'TiddlerOne', shape : 'elipse' },
          { id : 'AListTiddler', label : 'AListTiddler', shape : 'elipse' } ],
          edges : [
        { from : 'TiddlerTwo', to : 'TiddlerFour', style : 'arrow', width: 2 },
        { from : 'TiddlerTwo', to : 'testTiddler', style : 'arrow-center', width: 1 },
          { from : 'TiddlerTwo', to : 'TiddlerOne', style : 'arrow-center', width: 1 },
          { from : 'TiddlerOne', to : 'TiddlerTwo', style : 'arrow', width: 2 },
          { from : 'AListTiddler', to : 'TiddlerTwo', style : 'arrow', width: 1 } ] });
        expect(mockGraph.on).toHaveBeenCalled();
      });





    });

  }
}
());
