/*\
title: $:/plugins/emkay/visjs/timelinewidget.js
type: application/javascript
module-type: widget

  A widget for displaying timelines using Vis.js.  http://visjs.org

  For full help see $:/plugins/emkay/visjs/help

\*/

/*jslint node: true, browser: true */
/*global $tw: false */

(function() {
  'use strict';

  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  var moment = require("$:/plugins/emkay/visjs/moment.js").moment;
  var vis = require("$:/plugins/emkay/visjs/vis.js").vis;

  var TimelineWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
  };

  TimelineWidget.prototype = new Widget();

  TimelineWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    var dm = $tw.utils.domMaker;
    this.errorDiv = dm("div",{document: this.document, "class": "widget-error"});
    parent.insertBefore(this.errorDiv,nextSibling);
    this.domNodes.push(this.errorDiv);

    var attrParseWorked = this.execute();
    if (attrParseWorked === undefined) {
      var timelineHolder = this.document.createElement("div");
      parent.insertBefore(timelineHolder,nextSibling);
      this.domNodes.push(timelineHolder);
      this.createTimeline(timelineHolder);
      this.updateTimeline();
      // We follow the d3.js pattern here as children are ignored
      // this.renderChildren(timelineHolder,nextSibling);
    } else {
      this.errorDiv.innerHTML = this.parseTreeNode.type+": Unexpected attribute(s) "+attrParseWorked.join(", ");
      this.refresh = function() {}; // disable refresh of this as it won't work with incorrrect attributes
    }
  };


  // parseWidgetAttributes
  //
  // Utility to handle configutaion attributes for a widget.  
  // It handles validation, coercion and assignedment of attribute values to the current widgets fields.
  // Parent and nextSibling are required so that any errors can be rported 
  //
  // The attributeDefns are a object representing with a field for each attribute expected by the widget
  //
  // Each defintion field is an object with two fields
  // type - This is used to coerce values ebfore assignment (only string is currently supported, ie. 'type' is currently ignored)
  // defaultValue - When an attribute is not provided in the plugin call, then this value should be used instead
  //
  // If an attribute is passed to the plugin that is not expected (i.e. in the attributeDefns object), then this function returns false
  // and an error message is output on the parent.  This should be shown instead of the widget's usual view.
  //
  TimelineWidget.prototype.parseWidgetAttributes = function(attributeDefns) {
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

  TimelineWidget.prototype.execute = function() {
    var attrParseWorked = this.parseWidgetAttributes({
      filter:        {  type: "string", defaultValue: "[!is[system]]"},
           groupField: { type: "string", defaultValue: undefined},
           startDateField: { type: "string", defaultValue: "created"},
           endDateField:  { type: "string", defaultValue: undefined},
           format:  { type: "string", defaultValue: undefined},
           customTime:  { type: "string", defaultValue: "now"} });

    if ((attrParseWorked === undefined) && (this.filter)) {
      this.compiledFilter = this.wiki.compileFilter(this.filter);
    }

    return attrParseWorked;
  };

  TimelineWidget.prototype.getTimepointList = function(changedTiddlers) {
    var tiddlerList = [];
    // process the filter into an array of tiddler titles
    tiddlerList = this.compiledFilter.call(null, changedTiddlers, this.tiddler);
    // If filter is a list of tiddlers it will return tiddlers even if they are not in changed Tiddlers
    if (changedTiddlers !== undefined) {
      tiddlerList = tiddlerList.filter(function (e) { return changedTiddlers[e];});
    }
    var self = this;
    var withoutDraftsList = tiddlerList.filter(function(optionTitle) {
      var optionTiddler = self.wiki.getTiddler(optionTitle);
      if (optionTiddler === undefined) {
        // tiddler may not exist if list attribute provided to widget, so exclude
        return true;
      } else {
        var isDraft = optionTiddler && optionTiddler.hasField("draft.of");
        return !isDraft;
      }
    });
    return withoutDraftsList;
  };
  /*
     Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
     */
  TimelineWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes.filter || changedAttributes.startDateField || changedAttributes.endDateField || changedAttributes.groupField) {
      this.refreshSelf();
      this.updateTimeline();
      return true;
    } 
    if (this.displayedTiddlers.some(function (e) { return changedTiddlers[e.id]; })) {
      this.updateTimeline();
      return true;
    }
    var anyRelevantChanges = this.getTimepointList(changedTiddlers);
    if (anyRelevantChanges.length !== 0) {
      this.updateTimeline();
      return true;
    }
  };


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


  TimelineWidget.prototype.createTimeline = function(holderDiv) { 
    var data = [];
    // this.document === $tw.fakeDocument for test mode
    if (this.parentWidget.parentWidget.mockTimeline === undefined) {
      this.timeline = new vis.Timeline(holderDiv, data);
    } else {
      this.timeline = this.parentWidget.parentWidget.mockTimeline;
    }
    var self = this;
    this.timeline.on('select', function(properties) {
      // Check if background or a tiddler is selected
      if (properties.items.length !== 0) {
        var toTiddlerTitle = properties.items[0];
        var fromTiddlerTitle = self.getVariable("currentTiddler");
        displayTiddler(self, toTiddlerTitle, fromTiddlerTitle);
      }
    });
  };

  function dateFieldToDate(dateField, dateFormat) {
    if (dateField !== "") {
      if (dateFormat === undefined) {
        return $tw.utils.parseDate(dateField);
      } else {
        var m = moment(dateField, dateFormat, true);
        if (m.isValid()) {
          return m.toDate();
        }
      }
    }
  }

  function addTimeData(self) {
    return function(current, tiddlerName) {
      var currentData = current.data;
      var currentGroups = current.groups;
      var currentErrors = current.errors;
      var theTiddler = self.wiki.getTiddler(tiddlerName);
      // tiddler may not exist if list attribute provided to widget
      if (theTiddler !== undefined) {
        var tiddlerStartDate = theTiddler.getFieldString(self.startDateField);
        var startDate = dateFieldToDate(tiddlerStartDate, self.format);
        if (!isNaN(startDate)) {
          // var newTimepoint = {id: tiddlerName, content: tiddlerName, start: $tw.utils.formatDateString(startDate, "YYYY-0MM-0DD"), type: 'point'};
          var newTimepoint = {id: tiddlerName, content: tiddlerName, start: startDate, type: 'point'};
          if (self.groupField !== undefined) {
            var tiddlerGroup = theTiddler.getFieldString(self.groupField);
            if (tiddlerGroup !== "") {
              newTimepoint.group = tiddlerGroup;
              currentGroups[tiddlerGroup] = true;
            } else {
              newTimepoint.group = "Global";
              currentGroups.Global = true;
            }
          }
          if (self.endDateField !== undefined ) {
            var tiddlerEndDate = theTiddler.getFieldString(self.endDateField);
            var endDate = dateFieldToDate(tiddlerEndDate, self.format);
            if (!isNaN(endDate)) {
              // newTimepoint.end = $tw.utils.formatDateString(endDate, "YYYY-0MM-0DD");
              if (endDate < startDate) {
                currentErrors.push("End date ("+tiddlerEndDate+") on "+tiddlerName+"."+self.endDateField+" is before start date ("+tiddlerStartDate+") on "+tiddlerName+"."+self.startDateField);
              } else {
                newTimepoint.end = endDate;
                if (newTimepoint.end.getTime() != newTimepoint.start.getTime()) {
                  newTimepoint.type = 'range';
                }
              }
            } else {
              currentErrors.push("Not a endDate ("+tiddlerEndDate+") on "+tiddlerName+"."+self.endDateField);
            }
          }
          currentData.push(newTimepoint);
        } else {
          currentErrors.push("Not a startDate ("+tiddlerStartDate+") on "+tiddlerName+"."+self.startDateField);
        }
      } else {
        currentErrors.push("Unknown tiddler "+tiddlerName);
      }
      return {data: currentData, groups: currentGroups, errors: currentErrors};
    };
  }

  TimelineWidget.prototype.updateTimeline = function() {
    var d;
    var self = this;
    var timepointList = this.getTimepointList();
    var result = timepointList.reduce(addTimeData(self), {data: [], groups: {}, errors: []});
    this.displayedTiddlers = result.data;
    this.timeline.setItems(result.data);
    var options = {showCustomTime: true};
    this.timeline.setOptions(options);
    var theMax, theMin, startTime, endDate, endTime, minDate, maxDate;
    for (d in result.data) {
      startTime = result.data[d].start.getTime();
      endDate = result.data[d].end;
      if (endDate !== undefined) {
        endTime = endDate.getTime();
      }
      if (theMin === undefined || startTime < theMin) {
        theMin = startTime;
      }
      if (theMax === undefined || endTime > theMax) {
        theMax = endTime;
      }
    }
    if (theMin !== undefined) {
      minDate = new Date(theMin);
    }
    if (theMax !== undefined) {
      maxDate = new Date(theMax);
    }
    this.timeline.setWindow(minDate, maxDate);
    if (this.customTime !== "now") {
      var m = moment(this.customTime, "YYYYMMDD", true);
      if (m.isValid()) {
        this.timeline.setCustomTime(m.toDate());
      }
    }
    if (Object.keys(result.groups).length !== 0) {
      var theGroups = [];
      for (var g in result.groups) {
        theGroups.push({id: g, content: g});
      }
      this.timeline.setGroups(theGroups);
    }
    if (result.errors.length !== 0) {
      this.errorDiv.innerHTML = this.parseTreeNode.type+": "+result.errors.join("<br/>");
    }
  };


  exports.visjstimeline = TimelineWidget;

  }
  ());
