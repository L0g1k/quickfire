define(function (require, exports, module) {
    //var storageObj;

    var getItem = function(key){
        var obj = chromeStorageObj[key];
        if (!obj){
            return null;
        }
        else{
            return JSON.stringify(obj);
        }
    };

    var setItem = function(key, value){
        chromeStorageObj[key] = JSON.parse(value);
        chrome.storage.local.set(chromeStorageObj);
    };

    exports.getItem = getItem;
    exports.setItem = setItem;
});