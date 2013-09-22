chrome.app.runtime.onLaunched.addListener(function (arg) {
    require(["src/chrome/utils/DemoLoader"], function(demoLoader){
        demoLoader.checkThatDemosExist().done(launchEditor).fail(function(){
            demoLoader.loadDemos().done(launchEditor).fail(function(error){
                console.error("There was a problem loading demos. It's likely that the application won't " +
                    "function properly. Starting anyway...", error);
            })
        });
    });
});

function launchEditor() {
    chrome.app.window.create(
        'src/index.html',
        { bounds: { width:780, height:490}, type:"shell" });

}
