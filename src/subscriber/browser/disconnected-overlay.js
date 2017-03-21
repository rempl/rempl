/* eslint-env browser */

var onPublisherConnectionChanged = function() {};
var getOverlayEl = function() {};
var overlayEl = null;
var timer;

if (typeof document !== 'undefined') {
    getOverlayEl = function() {
        if (overlayEl === null) {
            overlayEl = document.createElement('div');
            overlayEl.setAttribute('style', 'position:fixed;z-index:1e10;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.9);text-align:center;font:12px arial;opacity:1;transition:opacity .5s');
            overlayEl.setAttribute('te29fvh5p6iktcff', '');
            overlayEl.innerHTML =
                '<style>' +
                    'body>:not([te29fvh5p6iktcff]){-webkit-filter:grayscale();filter:grayscale()}' +
                    '[te29fvh5p6iktcff].enter{opacity:0!important}' +
                    '.ohzkrb1i5b2daicw{background-color:#5096fa;display:inline-block;vertical-align:middle;height:6px;width:6px;margin:3px;opacity:0;animation-name:ohzkrb1i5b2daicw;animation-duration:.65s;animation-iteration-count:infinite;animation-direction:normal;border-radius:50%}.ohzkrb1i5b2daicw:nth-child(1){animation-delay:.1s}.ohzkrb1i5b2daicw:nth-child(2){animation-delay:.175s}.ohzkrb1i5b2daicw:nth-child(3){animation-delay:.25s}@keyframes ohzkrb1i5b2daicw{50%{opacity:1}}' +
                '</style>' +
                '<span style="margin:30px 0 5px;display:inline-block;padding:4px;background:white">Publisher connection is lost</span>' +
                '<div>' +
                  '<div class="ohzkrb1i5b2daicw"></div>' +
                  '<div class="ohzkrb1i5b2daicw"></div>' +
                  '<div class="ohzkrb1i5b2daicw"></div>' +
                '</div>';
        }

        return overlayEl;
    };

    onPublisherConnectionChanged = function(connected) {
        if (connected) {
            clearTimeout(timer);
            if (overlayEl !== null && overlayEl.parentNode) {
                overlayEl.parentNode.removeChild(overlayEl);
            }
        } else {
            timer = setTimeout(function() {
                getOverlayEl().className = 'enter';
                document.body.appendChild(getOverlayEl());
                setTimeout(function() {
                    getOverlayEl().className = '';
                }, 16);
            }, 300);
        }
    };
}

module.exports = onPublisherConnectionChanged;
