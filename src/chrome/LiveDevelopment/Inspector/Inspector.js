/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, brackets: true, $, window, navigator, Mustache, chrome */

define(function (require, exports, module) {
    "use strict";

    // jQuery exports object for events
    var $exports = $(exports),
        extensionId = "gbipnkadpcadnnelfkbgoenoojgabhfa",
        _socket = chrome.runtime.connect(extensionId, { name: 'RDPBridgeServer'}), // chrome extension 'socket'
        _messageId = 1, // id used for remote method calls, auto-incrementing
        _messageCallbacks = {}; // {id -> function} for remote method calls

    /** Send a message to the remote debugger
     * All passed arguments after the signature are passed on as parameters.
     * If the last argument is a function, it is used as the callback function.
     * @param {string} remote method
     * @param {object} the method signature
     */
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
        _socket.send(JSON.stringify({ method: method, id: id, params: params }));

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

    function connect(socketURL) {
        debug("Connecting to socket URL " + socketURL);
    }

    /**
     * Brackets would like to request a connection to each and every URL individually. That's because the underlying
     * remote debugging server in Chrome works on that model. Here, we are abandoning the remote debugging server completely,
     * and so we are free to also abandon the model of managing one connection for every page. It's more appropriate for
     * us to simply connect once to our remote debugging extension (the chrome extension that acts as a stand-in) and
     * be done with it. So as to interop nicely with Brackets, let's just tell it we're connected if everything looks ok.
     *
     * @param url
     * @returns {*}
     */
    function connectToURL(url) {
        debug("Connection to " + url + " requested");
        var deferred = $.Deferred();
        deferred.resolve();
        return deferred.promise();
    }

    function connected() {
        debug("Returning connection status");

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
    exports.init = init;
});