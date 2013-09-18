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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports, module) {
    "use strict";

    var AppInit              = brackets.getModule("utils/AppInit"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        FileUtils            = brackets.getModule("file/FileUtils"),
        LiveDevServerManager = brackets.getModule("LiveDevelopment/LiveDevServerManager"),
        BaseServer           = brackets.getModule("LiveDevelopment/Servers/BaseServer").BaseServer,
        NodeConnection       = brackets.getModule("utils/NodeConnection"),
        ProjectManager       = brackets.getModule("project/ProjectManager"),
        PreferencesManager    = brackets.getModule("preferences/PreferencesManager"),

        ChromeWebServer      = require("ChromeWebServer").ChromeWebServer,
        StaticServer         = require("StaticChromeServer").StaticChromeServer;

    //var config               = require("text")
    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the static server in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 5000; // 5 seconds
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred = new $.Deferred();

    var key = 'chrome-web-server-port';

    var defaults = {
        port: 8081
    }
    var preferenceStorage = PreferencesManager.getPreferenceStorage('com.brackets.preferences.global');
    var config = preferenceStorage.getValue(key);
    if(!config) {
        preferenceStorage.setValue(key, defaults);
        config = defaults;
    }
   // var config = PreferenceStorage.getItem('chrome-web-server-port');

    /**
     * @private
     * @type {NodeConnection}
     */
    var _nodeConnection = new NodeConnection();
    var _chromeWebServer = new ChromeWebServer("127.0.0.1", config.port, brackets.fs);
    /**
     * @private
     * @return {StaticServerProvider} The singleton StaticServerProvider initialized
     * on app ready.
     */
    function _createStaticServer() {
        var config = {
            chromeWebServer  : _chromeWebServer,
            pathResolver    : ProjectManager.makeProjectRelativeIfPossible,
            root            : ProjectManager.getProjectRoot().fullPath
        };
        
        return new StaticServer(config);
    }

    /**
     * Allows access to the deferred that manages the node connection. This
     * is *only* for unit tests. Messing with this not in testing will
     * potentially break everything.
     *
     * @private
     * @return {jQuery.Deferred} The deferred that manages the node connection
     */
    function _getNodeConnectionDeferred() {
        return _nodeConnectionDeferred;
    }
    
    function initExtension() {

        // Register as a Live Development server provider
        LiveDevServerManager.registerServer({ create: _createStaticServer }, 5);



        return $.Deferred().resolve().promise();
    }

    function getConfig() {
        return preferenceStorage.getValue(key);
    }

    exports.initExtension = initExtension;
    exports.getConfig = getConfig;
    // For unit tests only
    exports._getStaticServerProvider = _createStaticServer;
    exports._getNodeConnectionDeferred = _getNodeConnectionDeferred;
});
