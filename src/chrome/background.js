chrome.app.runtime.onLaunched.addListener(function (arg) {
    require(["src/chrome/utils/DemoLoader"], function (demoLoader) {
        demoLoader.checkThatDemosExist().done(launchEditor).fail(function () {
            demoLoader.loadDemos().done(launchEditor).fail(function (error) {
                console.error("There was a problem loading demos. It's likely that the application won't " +
                    "function properly. Starting anyway...", error);
            })
        });
    });
});


function launchEditor() {
    chrome.app.window.create(
        'src/index.html',

        {
            bounds: {
              width: 1366, height: 768
            },
            state: "maximized",
            id: "qf8",
            type: "shell"
        }

    );

}

// Will emulate a fresh install

function removeLocalData() {
    chrome.storage.local.clear();
    require(["src/chrome/lib/filer"], function(Obj){
        var Filer = Obj.Filer;
        var filer = new Filer();
        var onErr = console.error.bind(console);
        filer.init({size: 1024 * 1024, persistent: true}, onInit.bind(filer), onErr);

        function onInit(fs) {
            var fsURL = filer.pathToFilesystemURL('/samples');
            this.rm(fsURL, function success(){
                console.debug("Local data removed");
            }, onErr);
        }
    })

}


