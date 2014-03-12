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
        mockGraph = jasmine.createSpyObj('mockGraph', ['on', 'setItems', 'setGroups', 'setOptions', 'setCustomTime', 'setWindow']);
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
        createAndRenderWidgetNode('<$visjsgraph list="TiddlerTwo GettingStartedzzzz" madeUpAttr="created"/>');
        // Test the rendering
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjsgraph: Unexpected attribute(s) madeUpAttr</div></p>");
        expect(mockGraph.setItems).not.toHaveBeenCalled();
        // Change the included tiddler
        wiki.addTiddler({title: "TiddlerOne", text: "World-wide Jelly"});
        // Refresh
        wiki.addTiddler({title: "TiddlerTwo", created: new Date(2014,2,15), modified: new Date(2014,2,31), text: "More stuff"});
        refreshWidgetNode(["TiddlerTwo"]);
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjsgraph: Unexpected attribute(s) madeUpAttr</div></p>");
        expect(mockGraph.setItems).not.toHaveBeenCalled();
      });

      it("should render from a tiddlerList and default startDateField, setting start range to lowest", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjsgraph tiddler="AListTiddler"/>');
        // Test the rendering
        expect(mockGraph.setItems).toHaveBeenCalledWith([ 
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,15), type : 'point' },
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point' } ]);
        expect(mockGraph.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockGraph.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockGraph.on).toHaveBeenCalled();
        expect(mockGraph.setGroups).not.toHaveBeenCalled();
        expect(mockGraph.setCustomTime).not.toHaveBeenCalled();
      });



    });

  }
}
());
