/*\
title: $:/plugins/emkay/visjs/widgetutils.js
type: application/javascript
module-type: library

  A library of reusable functions, used in the tw5visjs

\*/

/*jslint node: true, browser: true */
/*global $tw: false */


(function() {
  'use strict';

  // parseWidgetAttributes
  //
  // Utility to handle configuration attributes for a widget.
  // It handles validation, coercion and assignment of attribute values to the current widgets fields.
  // Parent and nextSibling are required so that any errors can be reported
  //
  // The attributeDefns are a object representing with a field for each attribute expected by the widget
  //
  // Each definition field is an object with two fields
  // type - This is used to coerce values before assignment (only string and integer are currently supported)
  // defaultValue - When an attribute is not provided in the plugin call, then this value should be used instead
  //
  // If an attribute is passed to the plugin that is not expected (i.e. in the attributeDefns object), then this function returns false
  // and an error message is output on the parent.  This should be shown instead of the widget's usual view.
  //
  function parseWidgetAttributes(self, attributeDefns) {
    var errors = [];
    for (var attr in self.attributes) {
      if (attributeDefns[attr] === undefined) {
        errors.push(attr);
      } else {
        if (attributeDefns[attr].type == "string") {
          self[attr] = self.attributes[attr];
        } else if (attributeDefns[attr].type == "integer") {
          self[attr] = parseInt(self.attributes[attr] );
          if (isNaN(self[attr])) {
            delete self[attr];
          }
        }
      }
    }
    if (errors.length !== 0) {
      return errors;
    }
    for (var attrDefn in attributeDefns) {
      if (self[attrDefn] === undefined) {
        self[attrDefn] = attributeDefns[attrDefn].defaultValue;
      }
    }
    return undefined;
  }


  function displayTiddler(self,toTiddlerTitle){
    var domTiddler = self.parentDomNode.parentNode;
    var bounds = domTiddler.getBoundingClientRect();
    var e = {
      type: "tm-navigate",
      navigateTo: toTiddlerTitle,
      navigateFromTitle: self.getVariable("currentTiddler"),
      navigateFromNode: domTiddler,
      navigateFromClientRect: { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
      }
    };
    self.dispatchEvent(e);
  }

  exports.parseWidgetAttributes = parseWidgetAttributes;
  exports.displayTiddler = displayTiddler;

}
());
