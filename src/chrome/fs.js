/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global chrome, define */

chrome.storage.local.get(null, function(data){
    chromeStorageObj = data || {};
});
define(function (require, exports, module) {
    "use strict";

    var Async = require("utils/Async");
    var browserFS;
    var NO_ERROR = 0;
    var ERR_UNKNOWN = 1;
    var ERR_INVALID_PARAMS = 2;
    var ERR_NOT_FOUND = 3;
    var ERR_CANT_READ = 4;
    var ERR_UNSUPPORTED_ENCODING = 5;
    var ERR_CANT_WRITE = 6;
    var ERR_OUT_OF_SPACE = 7;
    var ERR_NOT_FILE = 8;
    var ERR_NOT_DIRECTORY = 9;

    var entries = [];
    var ENTRY_KEY = 'com.quickfire.directories';

    // Brackets will often stat a file, get it's path, then ask for it again right away through readFile.
    var statCache = {};

    var virtualFiles = [];

    function initFiler() {
        var deferred = $.Deferred();
        if(!browserFS) {
            var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem
            try {
                requestFileSystem(window.PERSISTENT, 1024*1024 /*1MB*/, function(fs){
                    browserFS = fs;
                    deferred.resolve();
                }, function(error){
                    deferred.reject(error)
                });
            } catch (e) {
                deferred.reject(e);
            }
        } else {
            deferred.resolve();
        }
        return deferred.promise();
    }

    function registerVirtualFileListing(file) {
        virtualFiles.push(file);
    }

    function addVirtualFileListing(path, contents) {
        webkitRequestFileSystem(Window.PERSISTENT, 5*1024*1024, function(fs){
            var errorCallback = function (error) {
                console.error(error);
            };
            fs.root.getFile(path, {create: true, exclusive: false}, function(fileEntry){
                // Create a FileWriter object for our FileEntry (log.txt).
                fileEntry.createWriter(function(fileWriter) {

                    fileWriter.onwriteend = function(e) {
                        console.log('Write completed.');
                    };

                    fileWriter.onerror = errorCallback;

                    // Create a new Blob and write it to log.txt.
                    var blob = new Blob([contents], {type: 'text/plain'});

                    fileWriter.write(blob);

                }, errorCallback);
                registerVirtualFileListing(fileEntry);
            }, errorCallback);
        });
    }

    function saveEntryReference(entryId) {
        var entries;

        try {
            var existing = chromeStorageObj[ENTRY_KEY] || [];
            existing.push(entryId);
            chromeStorageObj[ENTRY_KEY] = existing;
            chrome.storage.local.set(chromeStorageObj);

        } catch (e) {
            console.error('Entry storage not found', e.message);
        }
    }

    function getEntryReferences() {
        return chromeStorageObj[ENTRY_KEY] || [];
    }

    function _readDirectory(entry, callback) {
        if (entry.isDirectory)
            entry.createReader().readEntries(function (entries) {
                var map = entries.map(function (entry) {
                    return entry.name;
                });
                callback(brackets.fs.NO_ERROR, map);
            });
        else
            callback(brackets.fs.ERR_NOT_FOUND);
    }

    function readdir(path, callback) {

        var userDirectories = getEntryReferences();

        function lookInBrowser() {
            initFiler().then(function(){
                var deferred = $.Deferred();
                deferred.then(function(entry){
                    _readDirectory(entry, callback);
                }, function(error){
                    callback(brackets.fs.ERR_NOT_FOUND);
                })
                _resolvePath(browserFS.root, path, deferred);
            });
        }

        Async.any(userDirectories, _findPathInDirectory.bind(this, path)).then(function (entry) {
            _readDirectory(entry, callback);
        }).fail(function () {
                lookInBrowser();
        });
    }



    function findPath(entry, path, deferred) {
        if (entry.isDirectory) {
            if (path.indexOf(entry.fullPath) == -1) {
                deferred.reject();
            } else {
                if (path == entry.fullPath || path == (entry.fullPath + '/')) {
                    deferred.resolve(entry);
                } else {
                    _resolvePath(entry, path, deferred);
                }
            }

        } else {
            deferred.reject();
        }
    }

    function _findPathInDirectory(path, id) {
        var deferred = $.Deferred();
        chrome.fileSystem.isRestorable(id, function () {
            chrome.fileSystem.restoreEntry(id, function (entry) {
                findPath(entry, path, deferred);
            });
        });
        return deferred.promise();
    }

    function _resolvePath(entry, path, deferred) {
        entry.getFile(path, {}, function (file) {
            deferred.resolve(file);
        }, function (err) {
            if (err.code == FileError.TYPE_MISMATCH_ERR) {
                entry.getDirectory(path, {}, function (directory) {
                    deferred.resolve(directory);
                }, function (err) {
                    deferred.reject(err);
                });
            } else
                deferred.reject(err);
        });
    }

    function makedir(path, permission, callback) {
        console.debug("makedir", path);
        callback(ERR_CANT_READ);
    }

    function showOpenDialog(allowMultipleSelection,
                            chooseDirectories,
                            title,
                            initialPath,
                            fileTypes,
                            callback) {
        chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(entry){
            if(entry) {
                var entryId = chrome.fileSystem.retainEntry(entry);
                entries.push(entryId);
                saveEntryReference(entryId);
                callback(brackets.fs.NO_ERROR, [entry.fullPath]);
                /*entry.createReader().readEntries(function(files){
                    callback(brackets.fs.NO_ERROR, files);
                });*/
            } else {
                callback(brackets.fs.NO_ERROR, [])
            }

        });
    }

    function getFileW3C(path, options, callback, err) {
        var file = statCache[path];
        if(file) {
            callback(file);
        } else {
            var found = false;
            for (var i = 0; i < virtualFiles.length; i++) {
                var virtualFile = virtualFiles[i];
                if(virtualFile.fullPath == path) {
                    found = true;
                    callback(virtualFile);
                }
            }
            if(!found)
                err(brackets.fs.ERR_NOT_FOUND);
        }
    }

    function _statFile(entry, callback) {
        statCache[entry.fullPath] = entry;
        entry.file(function(file){
            callback(brackets.fs.NO_ERROR, {
                isFile: function() { return true },
                isDirectory: function() { return false },
                mtime: file.lastModifiedDate
            })
        });
    }

    function _statDirectory(entry, callback) {
        callback(brackets.fs.NO_ERROR, {
            isFile: function () {
                return false
            },
            isDirectory: function () {
                return true
            },
            mtime: new Date()
        });
    }

    function stat(path, callback) {
        var entries = getEntryReferences();

        function inBrowser() {
            statBrowserFS(path).then(function(entry){
                _completeStat(entry, callback);
            }, function(){
                callback(brackets.fs.ERR_NOT_FOUND);
            })
        }

        if(entries.length == 0) {
            inBrowser();
        } else {
            Async.any(entries, _findPathInDirectory.bind(this, path)).then(function(entry){
                _completeStat(entry, callback);
            }).fail(inBrowser);
        }
    }

    function _completeStat(entry, callback) {
        if (entry.isDirectory)
            _statDirectory(entry, callback)
        else
            _statFile(entry, callback)
    }

    function statBrowserFS(path) {
        var deferred = $.Deferred();

         initFiler().then(function(){
             findPath(browserFS.root, path, deferred);
         });

        return deferred.promise();
    }



    /**
     * Reads a file which we've already seen. If we haven't seen it, then try to load it via http request
     * to an application file (ie. a file which is part of the packaged app source)
     *
     * @param path
     * @param encoding
     * @param callback
     */
    function readFile(path, encoding, callback) {
        console.debug("readFile", path);
        var cachedFile = statCache[path];
        if(cachedFile)
            cachedFile.file(function(file){
                var reader = new FileReader();
                reader.readAsText(file, "utf-8");
                reader.onload = function(ev) {
                    callback(brackets.fs.NO_ERROR, ev.target.result);
                };
            });
        else
            requestApplicationFile(path, encoding, callback);


        //return NativeProxy.send("fs", "readFile", path, encoding, callback);
    }

    function requestApplicationFile(path, encoding, callback) {
        $.get(path)
            .done(function(data) { callback(brackets.fs.NO_ERROR, data); })
            .fail(function() { callback(brackets.fs.ERR_NOT_FOUND) });
    }

    function writeFile(path, data, encoding, callback) {
        console.debug("writeFile", path);
        var entry = statCache[path];
        if(!entry)
            callback(brackets.fs.ERR_NOT_FOUND);
        else {
            writeText(data, entry, encoding, callback);
        }


    }

    function writeText(data, entry, encoding, callback) {
        entry.createWriter(function (writer) {
            //writer.truncate(0);
            writer.onerror = function(err) {
                callback(err.code)
            };
            writer.onwriteend = function() {
                callback(brackets.fs.NO_ERROR);
            };

            var blob = new Blob([data], {type: 'text/plain'});
            var size = data.length;

            writer.write(blob);

        });
    }

    function chmod(path, mode, callback) {
        console.debug("chmod", path);
        return NativeProxy.send("fs", "chmod", path, mode, callback);
    }

    function unlink(path, callback) {
        console.debug("unlink", path);
        return NativeProxy.send("fs", "unlink", path, callback);
    }

    function cwd(callback) {
        console.debug("cwd", path);
        return NativeProxy.send("fs", "cwd", callback);
    }

    exports.NO_ERROR = NO_ERROR;
    exports.ERR_UNKNOWN = ERR_UNKNOWN;
    exports.ERR_INVALID_PARAMS = ERR_INVALID_PARAMS;
    exports.ERR_NOT_FOUND = ERR_NOT_FOUND;
    exports.ERR_CANT_READ = ERR_CANT_READ;
    exports.ERR_UNSUPPORTED_ENCODING = ERR_UNSUPPORTED_ENCODING;
    exports.ERR_CANT_WRITE = ERR_CANT_WRITE;
    exports.ERR_OUT_OF_SPACE = ERR_OUT_OF_SPACE;
    exports.ERR_NOT_FILE = ERR_NOT_FILE;
    exports.ERR_NOT_DIRECTORY = ERR_NOT_DIRECTORY;

    exports.getFileW3C = getFileW3C;
    exports.registerVirtualFileListing = registerVirtualFileListing;
    exports.addVirtualFileListing = addVirtualFileListing;
    exports.readdir = readdir;
    exports.makedir = makedir;
    exports.stat = stat;
    exports.showOpenDialog = showOpenDialog;
    exports.readFile = readFile;
    exports.writeFile = writeFile;
    exports.chmod = chmod;
    exports.unlink = unlink;
    exports.cwd = cwd;
});