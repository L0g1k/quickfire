function launchEditor() {
    chrome.app.runtime.onLaunched.addListener(function (arg) {
        chrome.app.window.create(
            'src/index.html',
            { bounds: { width:780, height:490}, type:"shell" });
    });
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

