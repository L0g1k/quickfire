/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
 maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports, module) {
    "use strict";

    var socketInfo;
    var FILTER_REQUEST_TIMEOUT = 5000;

    /**
     * @private
     * @type {number}
     * Duration to wait before passing a filtered request to the static file server.
     */
    var _filterRequestTimeout = FILTER_REQUEST_TIMEOUT;
function WebServerSimple(host, port, fs) {

    var self = this;
    if(!fs) console.error('Could not find file system; web server can not start');
    this.fs = fs;
    this._connected = false;
    this.timeoutId = 0;
    chrome.socket.create("tcp", {}, function(_socketInfo) {
        socketInfo = _socketInfo;
        self._connected = true;
        chrome.socket.listen(socketInfo.socketId, host, parseInt(port), 50, function(result) {
            //console.log("LISTENING:", result);
            chrome.socket.accept(socketInfo.socketId, function(acceptInfo){
                self.onAccept(acceptInfo);
            });
        });
    });
}

WebServerSimple.prototype.onAccept = function(acceptInfo) {
    this.readFromSocket(acceptInfo.socketId);
}

WebServerSimple.prototype.connected = function() {
    return this._connected;
}

WebServerSimple.prototype.readFromSocket = function(socketId) {
    //  Read in the data
    var self = this;
    chrome.socket.read(socketId, function(readInfo) {
        //console.log("READ", readInfo);
        // Parse the request.
        var data = arrayBufferToString(readInfo.data);
        //console.info("Started request processing ", data);
        if(data.indexOf("GET ") == 0) {
            var keepAlive = false;
            if (data.indexOf("Connection: keep-alive") != -1) {
                keepAlive = true;
            }

            // we can only deal with GET requests
            var uriEnd =  data.indexOf(" ", 4);
            if(uriEnd < 0) { /* throw a wobbler */ return; }
            var uri = data.substring(4, uriEnd);
            // strip qyery string
            var q = uri.indexOf("?");
            if (q != -1) {
                uri = uri.substring(0, q);
            }
            var path = decodeURIComponent(uri);
            self.fs.getFileW3C(path, { create: false }, function(file){

                file.file(function(theFile){
                   // console.log("GET 200 " + uri);
                    // dispatch request event
                    $(self).triggerHandler("staticServer.requestFilter", [socketId, path]);
                    //self.write200Response(socketId, theFile, false);
                    // set a timeout if custom responses are not returned
                   self.timeoutId = setTimeout(function () { self.write200Response(socketId, theFile, false); }, _filterRequestTimeout);
                });

            }, function(err){
                console.warn("File does not exist..." + path);
                self.writeErrorResponse(socketId, 404, false);
                return;
            });

        }
        else {
            // Throw an error
            chrome.socket.destroy(socketId);
        }
    });
}

WebServerSimple.prototype.writeErrorResponse = function(socketId, errorCode, keepAlive) {
    var self = this;
    var file = { size: 0 };
    //console.info("writeErrorResponse:: begin... ");
    //console.info("writeErrorResponse:: file = " + file);
    var contentType = "text/plain"; //(file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 " + errorCode + " Not Found\nContent-length: " + file.size + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
   // console.info("writeErrorResponse:: Done setting header...");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);
   // console.info("writeErrorResponse:: Done setting view...");
    chrome.socket.write(socketId, outputBuffer, function(writeInfo) {
        //console.log("WRITE", writeInfo);
        if (keepAlive) {
            self.readFromSocket(socketId);
        } else {
            chrome.socket.destroy(socketId);
            chrome.socket.accept(socketInfo.socketId, function(acceptInfo){
                self.onAccept(acceptInfo);
            });
        }
    });
   // console.info("writeErrorResponse::filereader:: end onload...");

    //console.info("writeErrorResponse:: end...");
};

    WebServerSimple.prototype.writeResponse = function(fileSize, contentType, keepAlive, data, socketId) {
        var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + fileSize + "\nAccess-Control-Allow-Origin: * \nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
        var outputBuffer = new ArrayBuffer(header.byteLength + fileSize);
        var view = new Uint8Array(outputBuffer);
        view.set(header, 0);
        view.set(new Uint8Array(data), header.byteLength);
        chrome.socket.write(socketId, outputBuffer, function (writeInfo) {
            if (keepAlive) {
                this.readFromSocket(socketId);
            } else {
                chrome.socket.destroy(socketId);
                chrome.socket.accept(socketInfo.socketId, this.onAccept.bind(this));
            }
        }.bind(this));
    }

    WebServerSimple.prototype.write200Response = function(socketId, file, keepAlive) {

        var reader = new FileReader();

        reader.onload = function(e) {
            var data = e.target.result;
            var fileSize = file.size;
            var contentType = (file.type === "") ? "text/plain" : file.type;
            this.writeResponse(fileSize, contentType, keepAlive, data, socketId);
        }.bind(this);

        reader.readAsArrayBuffer(file);

    };

var stringToUint8Array = function(string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for(var i = 0; i < string.length; i++) {
        view[i] = string.charCodeAt(i);
    }
    return view;
};

var arrayBufferToString = function(buffer) {
    var str = '';
    var uArrayVal = new Uint8Array(buffer);
    for(var s = 0; s < uArrayVal.length; s++) {
        str += String.fromCharCode(uArrayVal[s]);
    }
    return str;
};

    exports.ChromeWebServer = WebServerSimple;
});