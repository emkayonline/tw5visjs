/*\
title: test-render-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext rendering pipeline end-to-end. We also need tests that individually test parsers, rendertreenodes etc., but this gets us started.

\*/
(function(){

  'use strict';
  /*jslint node: true, browser: true */
  /*global $tw: false, describe: false, beforeEach: false, jasmine: false, it: false, expect:false */

      var wiki;
  if (!$tw.browser) {
    // Don't run tests if in browser (as we rely on loadTiddersNode)
    describe("vis.js Timeline Widget module", function() {

      var widgetNode, wrapper, mockTimeline;

      beforeEach(function () {
        $tw.loadTiddlersNode();
        wiki = $tw.wiki;
        // wiki = new $tw.Wiki();
        // // Add tiddlers
        // wiki.addTiddlers([
        //   {title: "TiddlerOne", created: new Date(2014,2,13), modified: new Date(2014,2,14), text: "Jolly Old World", born: "1966 September", died: "2066 September", mygroup: "people"},
        //   {title: "TiddlerTwo", created: new Date(2014,2,15), modified: new Date(2014,2,16), text: "More stuff", mygroup: "people", born: "1970 May"},
        //   {title: "IgnoredTiddler", created: new Date(2014,2,17), modified: new Date(2014,2,18), text: "More stuff", born: "Unparsable"},
        //   {title: "AListTiddler", created: new Date(2014,2,19), modified: new Date(2014,2,20), text: "Use the list on this tiddler", list: "TiddlerTwo TiddlerOne"},
        //   {title: "TiddlerThree", created: new Date(2014,2,21), modified: new Date(2014,2,22), text: "More stuff", born: "1971 December", died: "2071 December", mygroup: "animals"},
        //   {title: "TiddlerFour", created: new Date(2014,2,23), modified: new Date(2014,2,23), text: "Modified and created match"},
        //   {title: "OldTiddler", created: new Date(2014,2,24), modified: new Date(2014,2,25), text: "An old birth date", born: "1761"}
        //   ]);
      });


      var widget = require("$:/core/modules/widgets/widget.js");

      function createWidgetNode(parseTreeNode) {
        widgetNode	= new widget.widget(parseTreeNode,{
          wiki: wiki,
                    document: $tw.fakeDocument
          // variables: {currentTiddler: "TiddlerOne"}
        });
        mockTimeline = jasmine.createSpyObj('mockTimeline', ['on', 'setItems', 'setGroups', 'setOptions', 'setCustomTime', 'setWindow']);
        widgetNode.mockTimeline = mockTimeline;
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
        for (f in widgetNode.mockTimeline) {
          if (widgetNode.mockTimeline.hasOwnProperty(f)){  
            widgetNode.mockTimeline[f].reset();
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

      it("should report unexpected attributes", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerTwo GettingStartedzzzz" madeUpAttr="created"/>');
        // Test the rendering
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjstimeline: Unexpected attribute(s) madeUpAttr</div></p>");
        expect(mockTimeline.setItems).not.toHaveBeenCalled();
        // Change the included tiddler
        wiki.addTiddler({title: "TiddlerOne", text: "World-wide Jelly"});
        // Refresh
        wiki.addTiddler({title: "TiddlerTwo", created: new Date(2014,2,15), modified: new Date(2014,2,31), text: "More stuff"});
        refreshWidgetNode(["TiddlerTwo"]);
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjstimeline: Unexpected attribute(s) madeUpAttr</div></p>");
        expect(mockTimeline.setItems).not.toHaveBeenCalled();
      });

      it("should render from a tiddlerList and default startDateField, setting start range to lowest", function() {
        debugger;
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline tiddler="AListTiddler"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([ 
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,15), type : 'point' },
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point' } ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        expect(mockTimeline.setCustomTime).not.toHaveBeenCalled();
      });

      it("should set the a given custom time", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline tiddler="AListTiddler" customTime="20140201"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([ 
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,15), type : 'point' },
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point' } ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.setCustomTime).toHaveBeenCalledWith(new Date(2014,1,1));
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });

      it("should render from an non-existent tiddlerList", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline startDateField="created"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([  ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(undefined, undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });

      it("should handle a nonsensical filter, giving no timepoints", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline filter="[rubbish" startDateField="modified"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(undefined, undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjstimeline: Unknown tiddler Filter error: Missing [ in filter expression</div><div></div></p>");
      });

      it("should render with a specified filter and startDateField", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline filter="[prefix[Tiddler]]" startDateField="modified"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([ 
          { id: 'TiddlerFour', content: 'TiddlerFour', start: new Date(2014,2,23), type: 'point' },
          { id: 'TiddlerOne', content: 'TiddlerOne', start: new Date(2014,2,14), type: 'point' },
          { id: 'TiddlerThree', content: 'TiddlerThree', start: new Date(2014,2,22), type: 'point' },
          { id: 'TiddlerTwo', content: 'TiddlerTwo', start: new Date(2014,2,16), type: 'point' }
          ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,14), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });

      it("should render from a list attribute", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerOne TiddlerTwo" startDateField="created"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point' },
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,15), type : 'point' } ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });

      it("should skip any unknown tiddlers in a list attribute", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerOne UnknownTiddler" startDateField="created"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([{ id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjstimeline: Unknown tiddler UnknownTiddler</div><div></div></p>");
      });

      it("should group tiddlers based on an attribute", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerOne TiddlerTwo TiddlerThree" groupField="mygroup" />');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point', group: 'people' },
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,15), type : 'point', group: 'people'  },
          { id : 'TiddlerThree', content : 'TiddlerThree', start : new Date(2014,2,21), type : 'point', group: 'animals'  }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).toHaveBeenCalledWith([{ id: 'people', content: 'people'}, {id: 'animals', content: 'animals'}]);
      });

      it("should provide default grouping when field missing", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerOne TiddlerTwo TiddlerThree" groupField="unknowngroup" />');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point', group: 'Global' },
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,15), type : 'point', group: 'Global' },
          { id : 'TiddlerThree', content : 'TiddlerThree', start : new Date(2014,2,21), type : 'point', group: 'Global' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).toHaveBeenCalledWith([{id: 'Global', content: 'Global'}]);
      });

      it("should handle tiddlers with textual dates with specified format", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerOne TiddlerThree" startDateField="born" format="YYYY MMM"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(1966,8,1), type : 'point' },
          { id : 'TiddlerThree', content : 'TiddlerThree', start : new Date(1971,11,1), type : 'point' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(1966,8,1), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });

      it("should skip tiddlers with unparsable startDateField", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="IgnoredTiddler" startDateField="born" format="YYYY MMM"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(undefined, undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjstimeline: Not a startDate (Unparsable) on IgnoredTiddler.born</div><div></div></p>");
      });

      it("should skip tiddlers missing the startDateField", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerThree TiddlerFour" startDateField="born" format="YYYY MMM"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerThree', content : 'TiddlerThree', start : new Date(1971,11,1), type : 'point' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(1971,11,1), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjstimeline: Not a startDate () on TiddlerFour.born</div><div></div></p>");
      });

      it("should set tiddlers as range timepoints when using endDateField", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerThree" startDateField="born" endDateField="died" format="YYYY MMM"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerThree', content : 'TiddlerThree', start : new Date(1971,11,1), end : new Date(2071,11,1), type : 'range' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(1971,11,1), new Date(2071, 11,1));
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });

      it("should set tiddlers as point timepoints when start date matches end date (and set max correctly)", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerFour TiddlerThree" startDateField="created" endDateField="modified"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerFour', content : 'TiddlerFour', start : new Date(2014,2,23), end : new Date(2014,2,23), type : 'point' },
          { id : 'TiddlerThree', content : 'TiddlerThree', start : new Date(2014,2,21), end : new Date(2014,2,22), type : 'range' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,21), new Date(2014, 2,23));
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });

      it("should set tiddlers as point timepoints when missing endDateField", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerTwo TiddlerThree" startDateField="born" endDateField="died" format="YYYY MMM"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(1970,4,1), type : 'point' },
          { id : 'TiddlerThree', content : 'TiddlerThree', start : new Date(1971,11,1), end : new Date(2071,11,1), type : 'range' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(1970,4,1), new Date(2071,11,1));
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true });
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        expect(wrapper.innerHTML).toBe("<p><div class='widget-error'>visjstimeline: Not a endDate () on TiddlerTwo.died</div><div></div></p>");
      });

      it("should handle years as dates from a long time ago", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="OldTiddler" startDateField="born" format="YYYY"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'OldTiddler', content : 'OldTiddler', start : new Date(1761,0,1), type : 'point' }]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(1761,0,1), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true });
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
      });


      it("should refresh when an included tiddler changes", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerOne TiddlerTwo" startDateField="modified"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,14), type : 'point' },
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,16), type : 'point' } ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,14), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        // Change the transcluded tiddler
        wiki.addTiddler({title: "TiddlerTwo", created: new Date(2014,1,15), modified: new Date(2014,1,31), text: "More stuff"});
        // Refresh
        refreshWidgetNode(["TiddlerTwo"]);
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,14), type : 'point' },
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,1,31), type : 'point' } ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,1,31), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
      }
      );

      it("should not refresh when an irrelevant tiddler is changed", function() {
        // Construct the widget node
        createAndRenderWidgetNode('<$visjstimeline list="TiddlerOne TiddlerTwo" startDateField="created"/>');
        // Test the rendering
        expect(mockTimeline.setItems).toHaveBeenCalledWith([
          { id : 'TiddlerOne', content : 'TiddlerOne', start : new Date(2014,2,13), type : 'point' },
          { id : 'TiddlerTwo', content : 'TiddlerTwo', start : new Date(2014,2,15), type : 'point' } ]);
        expect(mockTimeline.setWindow).toHaveBeenCalledWith(new Date(2014,2,13), undefined);
        expect(mockTimeline.setOptions).toHaveBeenCalledWith({showCustomTime: true});
        expect(mockTimeline.on).toHaveBeenCalled();
        expect(mockTimeline.setGroups).not.toHaveBeenCalled();
        // Change another tiddler
        wiki.addTiddler( {title: "IgnoredTiddler", created: new Date(2014,1,17), modified: new Date(2014,1,31), text: "More stuff"});
        // Refresh
        refreshWidgetNode(["IgnoredTiddler"]);
        expect(mockTimeline.setItems).not.toHaveBeenCalled();
      });


    });
  }

}
());
