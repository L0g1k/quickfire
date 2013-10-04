/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, brackets: true, $, window, navigator, Mustache, chrome */

define(function (require, exports, module) {
    "use strict";
    function inject(css) {
        var i = 0,
        link = document.createElement('link');

        link.rel = 'stylesheet';
        var head = document.getElementsByTagName('head')[0],
        tmp;

        for(; i < css.length; i++){
            tmp = link.cloneNode();
            tmp.href = css[i];
            head.appendChild(tmp);
        }
    }

    exports.inject = inject;
});