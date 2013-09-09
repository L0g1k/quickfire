function launchEditor() {
    chrome.app.runtime.onLaunched.addListener(function (arg) {
        chrome.app.window.create(
            'src/index.html',
            { bounds: { width:780, height:490}, type:"shell" });
    });
}

function startWebServer(port) {
    setTimeout(function () {
        chrome.syncFileSystem.requestFileSystem(function (fs) {
            if(chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message)
            } else {
                console.log("Attempting to start main webserver");
                new WebServerSimple("127.0.0.1", port || 8080, fs);
                loadDemos(fs);
            }
        });

        initRDPWebServer();

    }, 500);
}

// emulate chrome remote debug manager - port comes from Inspector.js getDebuggableWindows
function initRDPWebServer() {
    var requestListener = function (req, res) {
        console.log("Request: ", req);
        res.writeHead(200, {
            "Access-control-allow-origin": "*",
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify([{
            description: "",
            faviconUrl: "",
            id: "C42D3306-7E65-787B-25E3-253873D74DFE",
            thumbnailUrl: "/thumb/C42D3306-7E65-787B-25E3-253873D74DFE",
            title: "GETTING STARTED WITH BRACKETS",
            type: "page",
            url: "chrome-extension://dhamihhdpahhblcpkdhmipomepjkhfce/src/LiveDevelopment/launch.html",
            "webSocketDebuggerUrl": "ws://localhost:8999"
        }]));
    }
    var server = window.httpChromify.createServer(requestListener);
    server.listen(9223);
}

function loadDemos(fs) {
    var alwaysDemo = false;
    if(alwaysDemo) {
        require(["src/chrome/demos/DemoLoader"], function(DemoLoader){
            console.log(DemoLoader);
            DemoLoader.loadDemos(fs);
        });
    }
    chrome.runtime.onInstalled.addListener(function(details){
        console.log(details);
        if(details.reason = "install") {
            require(["src/chrome/demos/DemoLoader"], function(DemoLoader){
                console.log(DemoLoader);
                DemoLoader.loadDemos(fs);
            });
        }
    });
}
launchEditor();
setTimeout(function () {

    try {


        startWebServer(8080);
    } catch (e) {
        console.error("Fatal: can't start web server", e.stack);
    }

}, 1250);          // Sometimes, attempts to access syncFS too quickly crash the app?
