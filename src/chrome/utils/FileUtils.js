/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, brackets: true, $, window, navigator, Mustache, chrome */

define(function (require, exports, module) {
    "use strict";

    exports.getRootFolder = function getRootFolderName(filePath) {
        // /samples/root/Getting%20Started/screenshots/quick-edit.png
        var folderName = null;
        var indexOf = filePath.indexOf('/');
        if(indexOf != -1) {
            if(indexOf == 0) {
                folderName = filePath.substr(1);
                indexOf = folderName.indexOf('/');
            }
            folderName = folderName.substr(0, indexOf);
        }
        return folderName;
    }
});