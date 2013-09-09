function syncFS() {

    var root = null;
    var self = this;
    var init = function (callback) {
            chrome.syncFileSystem.requestFileSystem(function (fileSystem) {
                root = fileSystem.root;
                console.log("Initialised sync FS");
                if(callback) {
                    callback();
                }
            });
        },

        locateFile = function (uri, callback) {
            console.log("Trying to locate file " + uri);
            if(!root)
                throw 'SyncFS file system was not initialised. Check that you are signed into Chrome';
            root.getFile(uri, {create: false},
                function(file) {
                    callback(file);
                },
                function(err) {
                    callback(null);
                    console.log(err)
                })

            //return locateFileInDirectory(uri, root, callback);
        },

        locateFileInDirectory = function (name, directory, callback) {
            var found = false
            directory.createReader().readEntries(function (entries) {
                for(var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    if (typeof entry !== 'undefined') {
                        console.log("Found entry " + entry.name);
                        if (entry.isFile) {
                            if (entry.fullPath == name) {
                                found = true;
                                entry.file(callback);
                            }
                        } else {
                            locateFileInDirectory(name, directory, callback);
                        }
                    }
                }
            });
            // Hacky way to determine if the file wasn't found.
            setTimeout(function() { if(!found) callback(null)}, 500);
        }

    return { init: init, locateFile: locateFile }
}
