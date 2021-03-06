/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, window, navigator */

define(function (require, exports, module) {
    "use strict";

    var AppInit = require("utils/AppInit"),
    fs = require("chrome/fs"),
    stylesheetInjector = require("utils/StylesheetInjector")

    AppInit.htmlReady(function(){
        stylesheetInjector.inject(["chrome/css/menu-fix.css"]);
    })
    function quit() {
        // unsupported
    }

    function abortQuit() {
        // unsupported
    }

    function showDeveloperTools() {
        // nothing (Chrome does this automatically)
    }

    function getElapsedMilliseconds() {
        return new Date().getTime() - window._startupTime;
    }

    function openLiveBrowser(url, enableRemoteDebugging, callback) {
        require(["preferences/PreferencesManager"], function(PreferencesManager){
            var config = PreferencesManager.getPreferenceStorage('com.brackets.preferences.global').getValue('chrome-web-server-port');
            window.open("http://localhost:" + config.port + "/" + url);
            if (callback) {
                callback();
            }
        })


    }

    function closeLiveBrowser(callback) {
        if (callback) {
            callback();
        }
    }

    function openURLInDefaultBrowser(url) {
            window.open(url, "_blank");
    }

    function showExtensionsFolder() {
        console.log("Not implemented in NativeProxy: app.showExtensionsFolder()", arguments);
    }

    function getApplicationSupportDirectory() {
        return ".";
    }

    function getNodeState(callback) {
        callback(-3); // ERR_NODE_FAILED
    }

    exports.language = navigator.language;

    exports.quit = quit;
    exports.abortQuit = abortQuit;
    exports.showDeveloperTools = showDeveloperTools;
    exports.getElapsedMilliseconds = getElapsedMilliseconds;
    exports.openLiveBrowser = openLiveBrowser;
    exports.closeLiveBrowser = closeLiveBrowser;
    exports.openURLInDefaultBrowser = openURLInDefaultBrowser;
    exports.showExtensionsFolder = showExtensionsFolder;
    exports.getApplicationSupportDirectory = getApplicationSupportDirectory;
    exports.getNodeState = getNodeState;
});