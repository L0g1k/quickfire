/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, brackets, window */

/**
 * ExtensionLoader searches the filesystem for extensions, then creates a new context for each one and loads it.
 * This module dispatches the following events:
 *      "load" - when an extension is successfully loaded. The second argument is the file path to the
 *          extension root.
 *      "loadFailed" - when an extension load is unsuccessful. The second argument is the file path to the
 *          extension root.
 */

define(function (require, exports, module) {
    "use strict";

    require("utils/Global");

    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils           = require("file/FileUtils"),
        Async               = require("utils/Async");

    // default async initExtension timeout
    var INIT_EXTENSION_TIMEOUT = 1000;

    var _init       = false,
        _extensions = {},
        _initExtensionTimeout = INIT_EXTENSION_TIMEOUT,
        /** @type {Object<string, Object>}  Stores require.js contexts of extensions */
            contexts    = {},
        srcPath     = FileUtils.getNativeBracketsDirectoryPath();

    // The native directory path ends with either "test" or "src". We need "src" to
    // load the text and i18n modules.
    srcPath = srcPath.replace(/\/test$/, "/src"); // convert from "test" to "src"

    var globalConfig = {
        "text" : srcPath + "/thirdparty/text/text",
        "i18n" : srcPath + "/thirdparty/i18n/i18n"
    };

    // TODO: When I wrote this, I didn't realise you could get the file system for the chrome app. It should
    // be refactored to replace hard-coded list with reading the directory?
    var extensions = [
        "CloseOthers",
        "CSSCodeHints",
        "HTMLCodeHints",
        "HTMLEntityCodeHints",
        "InlineColorEditor",
        "JavaScriptCodeHints",
        "JavaScriptQuickEdit",
        "JSLint",
        "LESSSupport",
        "QuickOpenCSS",
        "QuickOpenHTML",
        "QuickOpenJavaScript",
        "QuickView",
        "RecentProjects",
        "StaticChromeServer",
        "UrlCodeHints",
        "WebPlatformDocs"];


    /**
     * Returns the require.js require context used to load an extension
     *
     * @param {!string} name, used to identify the extension
     * @return {!Object} A require.js require object used to load the extension, or undefined if
     * there is no require object with that name
     */
    function getRequireContextForExtension(name) {
        return contexts[name];
    }

    function _loadAll(config, processExtension) {

        var result = new $.Deferred();
        var entryPoint = "main";

        Async.doInParallel(extensions, function (item) {
            var extConfig = {
                baseUrl: config.baseUrl + "/" + item,
                paths: config.paths
            };
            return processExtension(item, extConfig, entryPoint);
        }).always(function () {
                // Always resolve the promise even if some extensions had errors
                result.resolve();
            });

        return result;
    }

    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} name, used to identify the extension
     * @param {!{baseUrl: string}} config object with baseUrl property containing absolute path of extension
     * @param {!string} entryPoint, name of the main js file to load
     * @return {!$.Promise} A promise object that is resolved when the extension is loaded, or rejected
     *              if the extension fails to load or throws an exception immediately when loaded.
     *              (Note: if extension contains a JS syntax error, promise is resolved not rejected).
     */
    function loadExtension(name, config, entryPoint) {
        var result = new $.Deferred(),
            promise = result.promise(),
            extensionRequire = brackets.libRequire.config({
                context: name,
                baseUrl: config.baseUrl,
                /* FIXME (issue #1087): can we pass this from the global require context instead of hardcoding twice? */
                paths: config.paths || globalConfig,
                locale: brackets.getLocale()
            });
        contexts[name] = extensionRequire;

        // console.log("[Extension] starting to load " + config.baseUrl);

        extensionRequire([entryPoint],
            function (module) {
                // console.log("[Extension] finished loading " + config.baseUrl);
                var initPromise;

                _extensions[name] = module;

                if (module && module.initExtension && (typeof module.initExtension === "function")) {
                    // optional async extension init 
                    try {
                        initPromise = Async.withTimeout(module.initExtension(), _getInitExtensionTimeout());
                    } catch (err) {
                        console.error("[Extension] Error -- error thrown during initExtension for " + name + ": " + err);
                        result.reject(err);
                    }

                    if (initPromise) {
                        // WARNING: These calls to initPromise.fail() and initPromise.then(),
                        // could also result in a runtime error if initPromise is not a valid
                        // promise. Currently, the promise is wrapped via Async.withTimeout(),
                        // so the call is safe as-is.
                        initPromise.fail(function (err) {
                            if (err === Async.ERROR_TIMEOUT) {
                                console.error("[Extension] Error -- timeout during initExtension for " + name);
                            } else {
                                console.error("[Extension] Error -- failed initExtension for " + name + (err ? ": " + err : ""));
                            }
                        });

                        initPromise.then(result.resolve, result.reject);
                    } else {
                        result.resolve();
                    }
                } else {
                    result.resolve();
                }
            },
            function errback(err) {
                console.error("[Extension] failed to load " + config.baseUrl, err);
                if (err.requireType === "define") {
                    // This type has a useful stack (exception thrown by ext code or info on bad getModule() call)
                    console.log(err.stack);
                }
                result.reject();
            });

        result.done(function () {
            $(exports).triggerHandler("load", config.baseUrl);
        }).fail(function () {
                $(exports).triggerHandler("loadFailed", config.baseUrl);
            });

        return promise;
    }



    /**
     * Loads the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
     *                  each subdirectory is interpreted as an independent extension
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function loadAllExtensionsInNativeDirectory(directory) {
        console.error("Not implemented in Chrome");
    }

    function getUserExtensionPath() {
        console.error("Not implemented in Chrome");
        return "";
    }

    /**
     * Runs unit test for the extension that lives at baseUrl into its own Require.js context
     *
     * @param {!string} directory, an absolute native path that contains a directory of extensions.
     *                  each subdirectory is interpreted as an independent extension
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function testAllExtensionsInNativeDirectory(directory) {
        console.error("Not implemented in Chrome");
    }

    /**
     * Load extensions.
     *
     * @param {?string} A list containing references to extension source
     *      location. A source location may be either (a) a folder path
     *      relative to src/extensions or (b) an absolute path.
     * @return {!$.Promise} A promise object that is resolved when all extensions complete loading.
     */
    function init(paths) {
        // Only init once. Return a resolved promise.
        var deferred = new $.Deferred();
        if (_init) {
            return deferred.resolve().promise();
        }

        var promise = _loadAll({baseUrl: 'extensions/default'}, loadExtension);

        promise.always(function () {
            _init = true;
        });

        return promise;
    }

    /**
     * @private
     * Get timeout value for rejecting an extension's async initExtension promise.
     * @return {number} Timeout in milliseconds
     */
    function _getInitExtensionTimeout() {
        return _initExtensionTimeout;
    }

    /**
     * @private
     * Set timeout for rejecting an extension's async initExtension promise.
     * @param {number} value Timeout in milliseconds
     */
    function _setInitExtensionTimeout(value) {
        _initExtensionTimeout = value;
    }

    // unit tests
    exports._setInitExtensionTimeout = _getInitExtensionTimeout;
    exports._getInitExtensionTimeout = _setInitExtensionTimeout;

    // public API
    exports.init = init;
    exports.getUserExtensionPath = getUserExtensionPath;
    exports.getRequireContextForExtension = getRequireContextForExtension;
    exports.loadExtension = loadExtension;
    exports.testExtension = function() {};
    exports.loadAllExtensionsInNativeDirectory = loadAllExtensionsInNativeDirectory;
    exports.testAllExtensionsInNativeDirectory = testAllExtensionsInNativeDirectory;
});
