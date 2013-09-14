/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, window, navigator */

define(function (require, exports, module) {
    "use strict";

    var AppInit = require("utils/AppInit");
    var fs = require("chrome/fs");

    AppInit.appReady(function () {

        var interstitial = '__launch__.html';
        fs.getFileW3C(interstitial, {create: false}, function(file) {
            fs.registerVirtualFileListing(file);
            console.debug("Success: Interstitial page found");
        }, function(err){
            if(err == brackets.fs.ERR_NOT_FOUND) {
                console.log("Creating interstitial page");
                $.get('LiveDevelopment/launch.html').then(function(data){
                    fs.addVirtualFileListing(interstitial, data);
                });
            }
        })

    });

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
        if (callback) {
            callback();
        }
    }

    function closeLiveBrowser(callback) {
        if (callback) {
            callback();
        }
    }

    function openURLInDefaultBrowser(callback, url) {
        window.open("url", "_blank");
        if (callback) {
            callback();
        }
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