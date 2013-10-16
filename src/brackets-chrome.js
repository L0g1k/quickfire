/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, brackets: true, $, window, navigator, Mustache */
chrome.storage.local.get(null, function(data){
    chromeStorageObj = data || {};
    require(["./brackets.js"], function(brackets){

    })
});
