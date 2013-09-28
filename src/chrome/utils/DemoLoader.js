/*global $, chrome, brackets, define */

/**
 * Brackets expects a bunch of files to be available in /samples. The only way we can have things
 * in the file system without user interaction is to load them into the browser's file system. Chrome
 * offers it's own file system which is a read only representation of what's in the app folder.
 *
 * So, to load the demos we just copy all the files from /samples in the packaged app directory over to
 * the browser's file system. Later, we patch the Quickfire/Brackets file system code to look in both
 * the browser's file system as well as the user's file system any time its asked to find files. That
 * way, the Brackets ProjectManager can carry on loading the welcome project at startup.
 *
 */
define(function (require, exports, module) {

    var samples;
    var Filer = require("src/chrome/lib/filer").Filer;
    var filer = new Filer();
    var masterDeferred;

    function checkThatDemosExist() {
        var deferred = $.Deferred();
        var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem
        try {
            requestFileSystem(window.PERSISTENT, 1024*1024 /*1MB*/, function(fs){
                fs.root.getDirectory("samples", {create: false}, deferred.resolve, deferred.reject);
            }, function(error){
                deferred.reject(error)
            });
        } catch (e) {
            deferred.reject(e);
        }

        return deferred.promise();
    }

    function loadDemos() {
        masterDeferred = $.Deferred();
        initBrowserFS().then(initPackagedAppFS, masterDeferred.reject).then(copyDemos, masterDeferred.reject)
        return masterDeferred.promise();
    }

    function initBrowserFS() {
        var deferred = $.Deferred();
        filer.init({persistent: true, size: 5 * 1024 * 1024}, deferred.resolve, deferred.reject);
        return deferred.promise();
    }

    function initPackagedAppFS() {
        var deferred = $.Deferred();
        try {
            chrome.runtime.getPackageDirectoryEntry(function(packageRoot) {
                packageRoot.getDirectory("samples", { create: false }, function(directoryEntry) {
                    samples = directoryEntry;
                    deferred.resolve();
                }, deferred.reject);
            });
        } catch (e) {
            masterDeferred.reject(e.message);
        }
        return deferred.promise();
    }

    function copyDemos() {
        try {
            filer.cp(samples, filer.fs.root);
            masterDeferred.resolve();
        } catch (e) {
            masterDeferred.reject(e);
        }
    }

    exports.checkThatDemosExist = checkThatDemosExist;
    exports.loadDemos = loadDemos;
});