/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, brackets: true, $, window, navigator, Mustache, chrome */

define(function (require, exports, module) {
    "use strict";

    // jQuery exports object for events
    var $exports = $(exports),
        extensionId = "paoopjjblcebddifekcalpddjekpbipn",
        _connectDeferred, // The deferred connect
        _socket, // chrome extension 'socket'
        _messageId = 1, // id used for remote method calls, auto-incrementing
        _messageCallbacks = {}; // {id -> function} for remote method calls

    var NativeApp = require("utils/NativeApp"),
        WebSocketServer = require("chrome/lib/chrome-websocket");

        function initSocket() {
        _socket.onMessage.addListener(_onMessage);
        _socket.onDisconnect.addListener(_onDisconnect);
    }
    /** Send a message to the remote debugger
     * All passed arguments after the signature are passed on as parameters.
     * If the last argument is a function, it is used as the callback function.
     * @param {string} remote method
     * @param {object} the method signature
     */

    function autoDetectExtensionId() {
        var port = 9876;
        var wss = new WebSocketServer(port, "127.0.0.1");
        console.debug("Listening for extension id information on port " + port);
        wss.onMessage(function(_message) {
            var message = JSON.parse(_message);
            if(message.extensionId) {
                extensionId = message.extensionId;
                console.debug("Set extension id to " + extensionId);
                wss.send(JSON.stringify({
                    extensionIdSet: true
                }))
            }
        });
    }

    function _onDisconnect() {
        _socket = undefined;
        $exports.triggerHandler("disconnect");
    }
    /** Received message from the WebSocket
     * A message can be one of three things:
     *   1. an error -> report it
     *   2. the response to a previous command -> run the stored callback
     *   3. an event -> trigger an event handler method
     * @param {object} message
     */
    function _onMessage(message) {
        var response = JSON.parse(message.data);
        console.debug("Extension:\t", response);
        $exports.triggerHandler("message", [response]);
        if (response.error) {
            $exports.triggerHandler("error", [response.error]);
        } else if (response.result) {
            if (_messageCallbacks[response.id]) {
                _messageCallbacks[response.id](response.result);
                delete _messageCallbacks[response.id];
            }
        } else {
            var domainAndMethod = response.method.split(".");
            var domain = domainAndMethod[0];
            var method = domainAndMethod[1];
            $(exports[domain]).triggerHandler(method, response.params);
        }
    }

    function checkExtension() {
        var deferred = $.Deferred();

        try {

            var listener = function (message) {
                if (message == "polo") {
                    console.debug("Extension installed");
                    deferred.resolve();
                    _socket.onMessage.removeListener(listener);
                    clearTimeout(timer);
                }
            };
            var timer = setTimeout(function () {
                deferred.reject();
            }, 100);
            _socket = chrome.runtime.connect(extensionId, { name: 'RDPBridgeServer'}); // chrome extension 'socket'
            _socket.onMessage.addListener(listener);
            _socket.postMessage("marco");
        } catch (e) {
            deferred.reject();
            _connectDeferred = null;
        }

        return deferred.promise();
    }

    function _send(method, signature, varargs) {
        if (!_socket) {
            // FUTURE: Our current implementation closes and re-opens an inspector connection whenever
            // a new HTML file is selected. If done quickly enough, pending requests from the previous
            // connection could come in before the new socket connection is established. For now we
            // simply ignore this condition.
            // This race condition will go away once we support multiple inspector connections and turn
            // off auto re-opening when a new HTML file is selected.
            return;
        }

        console.assert(_socket, "You must connect to the WebSocket before sending messages.");
        var id, callback, args, i, params = {}, promise;

        // extract the parameters, the callback function, and the message id
        args = Array.prototype.slice.call(arguments, 2);
        if (typeof args[args.length - 1] === "function") {
            callback = args.pop();
        } else {
            var deferred = new $.Deferred();
            promise = deferred.promise();
            callback = function (result) {
                deferred.resolve(result);
            };
        }

        id = _messageId++;
        _messageCallbacks[id] = callback;

        // verify the parameters against the method signature
        // this also constructs the params object of type {name -> value}
        for (i in signature) {
            if (_verifySignature(args[i], signature[i])) {
                params[signature[i].name] = args[i];
            }
        }

        var message = { method: method, id: id, params: params };
        console.debug("Sending message:\t" + message.method);
        _socket.postMessage(message);

        return promise;
    }

    function getDebuggableWindows(host, port) {

    }

    /** Register a handler to be called when the given event is triggered
     * @param {string} event name
     * @param {function} handler function
     */
    function on(name, handler) {
        $exports.on(name, handler);
    }

    /** Remove the given or all event handler(s) for the given event or remove all event handlers
     * @param {string} optional event name
     * @param {function} optional handler function
     */
    function off(name, handler) {
        $exports.off(name, handler);
    }

    function disconnect() {
        debug("Disconnecting");
    }

    /**
     * Brackets would like to request a connection to each and every URL individually. That's because the underlying
     * remote debugging server in Chrome works on that model. Here, we are abandoning the remote debugging server completely,
     * and so we are free to also abandon the aforementioned technique. It's more appropriate for
     * us to simply connect once to our remote debugging extension (the chrome extension that acts as a stand-in) and
     * be done with it. So as to interop nicely with Brackets, let's just tell it we're connected if everything looks ok.
     *
     * @param url
     * @returns {*}
     */
    function connect(socketURL) {
        debug("Connecting to socket URL " + socketURL);

    }


    /**
     * We have to serve the interstitial page manually through the web server. If brackets asks for
     * that page, we transform the URL so it works.
     *
     * @param url
     * @returns {*}
     */
    function connectToURL() {

        if (_connectDeferred) {
            // reject an existing connection attempt
            _connectDeferred.reject("CANCEL");
        }
        var deferred = new $.Deferred();
        _connectDeferred = deferred;
        var promise = checkExtension();
        promise.done(function () {
            deferred.resolve();
            _connectDeferred = null;
            NativeApp.openLiveBrowser("about:blank");
            setTimeout(function(){
                $exports.triggerHandler("connect");
            }, 2000);

            initSocket();

        });
        promise.fail(function onFail(err) {
            deferred.reject(err);
        });
        return deferred.promise();

    }

    function connected() {
        debug("Returning connection status");
        if(_socket) {
            try {
                _socket.postMessage({});
                return true;
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    }
    
    function debug(message) {
        console.debug("Inspector:\t" + message);
    }

    /** Initialize the Inspector
     * Read the Inspector.json configuration and define the command objects
     * -> Inspector.domain.command()
     */
    function init(theConfig) {
        debug("Initialising");
        exports.config = theConfig;

        var InspectorText = require("text!LiveDevelopment/Inspector/Inspector.json"),
            InspectorJSON = JSON.parse(InspectorText);

        var i, j, domain, domainDef, command;
        for (i in InspectorJSON.domains) {
            domain = InspectorJSON.domains[i];
            exports[domain.domain] = {};
            for (j in domain.commands) {
                command = domain.commands[j];
                exports[domain.domain][command.name] = _send.bind(undefined, domain.domain + "." + command.name, command.parameters);
            }
        }

    }

    /** Check a parameter value against the given signature
     * This only checks for optional parameters, not types
     * Type checking is complex because of $ref and done on the remote end anyways
     * @param {signature}
     * @param {value}
     */
    function _verifySignature(signature, value) {
        if (value === undefined) {
            console.assert(signature.optional === true, "Missing argument: " + signature.name);
        }
        return true;
    }

    // Export public functions
    exports.getDebuggableWindows = getDebuggableWindows;
    exports.on = on;
    exports.off = off;
    exports.disconnect = disconnect;
    exports.connect = connect;
    exports.connectToURL = connectToURL;
    exports.connected = connected;
    exports.autoDetectExtensionId = autoDetectExtensionId;
    exports.init = init;
});