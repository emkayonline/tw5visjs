# TiddlyWiki 5 vis.js plug-in

This plug-in allows TW5 to display tiddlers using the [vis.js](http://visjs.org) graphical timeline and graph widgets.

This plug-in has been testing on OS X with Safari, Chrome and Firefox, but should work under all operating systems and browser supported by TW5 and vis.js.

Also, the plug-in has been designed to work off-line, enabling it to be used without a wireless connection on an iPad/iPhone using [TWEdit](http://itunes.apple.com/gb/app/twedit/id409607956?mt=8)

## Requirements

This plugin requires TiddlyWiki 5.0.8-beta or later.

## Demonstration

A demonstration of the wiki can be see at this projects [demo wiki](http://emkayonline.github.io/tw5visjs).

To see the timeline in action,  view the tiddler called ShowTimelineDemo.  To view the graph in action, view the tiddler ShowGraph.

The timeline is best viewed by increasing the window width in Theme Tweaks in the Appearance section of the ControlPanel.

## Documentation

The documentation on usage of the plug-in can be found in the shadow tiddler $:/plugins/emkay/visjs/help.  (The intention is to integrate this with the TW5 help system, when that system is finalised).

## Installation

If you don't wish to clone the source of this plug-in (to edit the code and run it under node.js), then you can install a version in your own wiki using the wiki at [demo wiki](http://emkayonline.github.io/tw5visjs).

*NOTE: For installation of TW5 plug-ins, currently, there seems to be an issue using Safari's drag and drop, so I would recommend Firefox or Chrome.*

1. Open your own wiki in a browser window
2. In a separate browser window browse to [demo wiki](http://emkayonline.github.io/tw5visjs) and open the ControlPanel
3. In the ControlPanel chose the plugins tag.  From there, drag $:/plugins/emkay/visjs into your wiki.
4. Save your wiki
5. Reopen your wiki.

## Development

If you wish to edit the code for this plug-in, please clone this git repository.  This project uses git submodules for moment.js and vis.js, so to clone these at the same time, use

    git clone --recursive https://github.com/emkayonline/tw5visjs.git

For development and testing I run TiddlyWiki using node.js. See the TW5 node.js [installation instructions](http://tiddlywiki.com/static/TiddlyWiki%2520on%2520Node.js.html).

### Testing

The plug-in can be tested at the command line using a node installation of TW5.

The tests are written using the TW5 jasmine plug-in.


To run the command line tests, in the root directory of this project type

    tiddlywiki .

This will run all of the command line tests.  This checks all the calculations and transformations work, but does not test the visual part of the plug-in.

#### jasmine patch

Due to a bug in jasmine 1.3.1 (It has a cross-frame issues with detecting date objects), I have has to patch the one bundled with TW5.

The patch required is at line 960 of plugins/tiddlywiki/jasmine/jasmine-1.3.1/jasmine.js in the TiddlyWiki 5 copy of jasmine.  Please replace line 960 with:

    if (Object.prototype.toString.call(a) == "[object Date]" && Object.prototype.toString.call(b) == "[object Date]" ) {


If you do not apply this patch tests will pass when they shouldn't.  You should only need to apply this patch if you intend to edit and test the tw5visjs code.


### Visual Test and Demonstration

To run tiddlywiki with the development version of the widget:

    tiddlywiki --server

Then navigate to [http://localhost:8080]( http://localhost:8080 )

This wiki has been configured to not save changes to the server.

To run the visual tests, view the tiddler called ShowTimelineTests.  This will show messages for the cases that test for invalid parameters, formats etc.

