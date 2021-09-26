/* eslint-env browser */

var utils = require('../../utils/index.js');
var setOverlayVisible = function () {};
var initOverlayEl = function () {};
var enterClass = utils.genUID();
var overlayEl = null;
var timer;

if (typeof document !== 'undefined') {
    initOverlayEl = function () {
        if (overlayEl === null) {
            var circleClass = utils.genUID();
            var overlayClass = utils.genUID();

            overlayEl = document.createElement('div');
            overlayEl.setAttribute(
                'style',
                'position:fixed;z-index:1e10;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.9);text-align:center;font:12px arial;opacity:1;transition:opacity .5s'
            );
            overlayEl.className = overlayClass;
            overlayEl.innerHTML =
                '<style>' +
                'body>:not(.' +
                overlayClass +
                '){-webkit-filter:grayscale();filter:grayscale()}' +
                '.' +
                overlayClass +
                '.' +
                enterClass +
                '{opacity:0!important}' +
                '.' +
                circleClass +
                '{background-color:#5096fa;display:inline-block;vertical-align:middle;height:6px;width:6px;margin:3px;opacity:0;animation-name:' +
                circleClass +
                ';animation-duration:.65s;animation-iteration-count:infinite;animation-direction:normal;border-radius:50%}.' +
                circleClass +
                ':nth-child(1){animation-delay:.1s}.' +
                circleClass +
                ':nth-child(2){animation-delay:.175s}.' +
                circleClass +
                ':nth-child(3){animation-delay:.25s}@keyframes ' +
                circleClass +
                '{50%{opacity:1}}' +
                '</style>' +
                '<span style="margin:30px 0 5px;display:inline-block;padding:4px;background:white">Publisher connection is lost</span>' +
                '<div>' +
                '<div class="' +
                circleClass +
                '"></div>' +
                '<div class="' +
                circleClass +
                '"></div>' +
                '<div class="' +
                circleClass +
                '"></div>' +
                '</div>';
        }
    };

    setOverlayVisible = function (visible) {
        if (visible) {
            timer = setTimeout(function () {
                initOverlayEl();
                overlayEl.classList.add(enterClass);
                document.body.appendChild(overlayEl);
                setTimeout(function () {
                    overlayEl.classList.remove(enterClass);
                }, 16);
            }, 300);
        } else {
            clearTimeout(timer);
            if (overlayEl !== null && overlayEl.parentNode) {
                overlayEl.parentNode.removeChild(overlayEl);
            }
        }
    };
}

module.exports = setOverlayVisible;
