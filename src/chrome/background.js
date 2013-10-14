function addLaunchHandler() {
    chrome.app.runtime.onLaunched.addListener(function (details) {
        if(details.reason = "install") {
            removeLocalData();
        }
        require(["src/chrome/utils/DemoLoader"], function (demoLoader) {
            demoLoader.checkThatDemosExist().done(function(){
                console.debug("Demo data exists");
                launchEditor();
            }).fail(function () {
                    console.debug("Demo data doesn't exist; creating it");
                    demoLoader.loadDemos().done(launchEditor).fail(function (error) {
                        console.error("There was a problem loading demos. It's likely that the application won't " +
                            "function properly. Starting anyway...", error);
                        launchEditor();
                    })
                });
        });
    });
}
var quickfire = {
    socketIds: []
}
chrome.storage.local.get(null, function(data){
    quickfire.chromeStorageObj = data || {};
    try {
        setExtensionId()
    } catch (e) {
        console.warn("Couldn't auto detect extension id. Continuing anyway, but live development may not work.", e.stack)
    } finally {
        addLaunchHandler();
    }
});

function launchEditor() {

chrome.app.window.create(
    'src/index.html?hasNativeMenus=false', {
        bounds: {
            width: 1366, height: 768
        },
        state: "maximized",
        id: "qf8",
        type: "shell"
    }, function(editorWindow) {
        editorWindow.quickfire = quickfire;
        editorWindow.onClosed.addListener(function(){
            console.log("Closing sockets", editorWindow.quickfire.socketIds);
            editorWindow.quickfire.socketIds.forEach(function(socketId){
                chrome.socket.destroy(socketId)
            })
            editorWindow.quickfire.socketIds = [];
        })
    }

);

}

// Will emulate a fresh install

function removeLocalData(demos) {

    var deferred = $.Deferred();
    chrome.storage.local.clear();

    if(demos) {
        require(["src/chrome/lib/filer"], function(Obj) {
            var Filer = Obj.Filer;
            var filer = new Filer();
            var onErr = console.error.bind(console);
            filer.init({size: 1024 * 1024, persistent: true}, onInit.bind(filer), onErr);

            function onInit(fs) {
                var fsURL = filer.pathToFilesystemURL('/samples');
                this.rm(fsURL, function success(){
                    console.debug("Local data removed");
                    deferred.resolve();
                }, deferred.reject);
            }
        })
    }

    return deferred.promise();
}

function setExtensionId() {
    require(["src/chrome/lib/chrome-websocket"], function(WebSocketServer) {
        var port = 9876;
        var wss = new WebSocketServer(port, "127.0.0.1");
        console.debug("Listening for extension id information on port " + port);

        var ENTRY_KEY = 'com.quickfire.extensionId'
        wss.onMessage(function(_message) {
            var message = JSON.parse(_message);
            if(message.extensionId) {
                extensionId = message.extensionId;
                console.debug("Set extension id to " + extensionId);
                quickfire.chromeStorageObj[ENTRY_KEY] = extensionId;
                chrome.storage.local.set(quickfire.chromeStorageObj);
                wss.send(JSON.stringify({
                    extensionIdSet: true
                }))
            }
        });
    });
}




window.closeSocket = function() {
    console.log("Closing socket");
}