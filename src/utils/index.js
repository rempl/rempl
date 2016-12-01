'use strict';

var global = new Function('return this')();
var document = global.document;

function complete(dest, source) {
    for (var key in source) {
        if (key in dest == false) {
            dest[key] = source[key];
        }
    }

    return dest;
}

function slice(src, offset) {
    return Array.prototype.slice.call(src, offset);
}

function genUID(len) {
    function base36(val) {
        return Math.round(val).toString(36);
    }

    // uid should starts with alpha
    var result = base36(10 + 25 * Math.random());

    if (!len) {
        len = 16;
    }

    while (result.length < len) {
        result += base36(new Date * Math.random());
    }

    return result.substr(0, len);
}

var ready = (function() {
    var eventFired = !document || document.readyState == 'complete';
    var readyHandlers = [];
    var timer;

    function processReadyHandler() {
        var handler;

        // if any timer - reset it
        if (timer) {
            timer = clearTimeout(timer);
        }

        // if handlers queue has more than one handler, set emergency timer
        // make sure we continue to process the queue on exception
        // helps to avoid try/catch
        if (readyHandlers.length > 1) {
            timer = setTimeout(processReadyHandler, 0);
        }

        // process handler queue
        while (handler = readyHandlers.shift()) {
            handler[0].call(handler[1]);
        }

        // remove emergency timer as all handlers are process
        timer = clearTimeout(timer);
    }

    function fireHandlers() {
        if (!eventFired++) {
            processReadyHandler();
        }
    }

    // the DOM ready check for Internet Explorer
    function doScrollCheck() {
        try {
            // use the trick by Diego Perini
            // http://javascript.nwbox.com/IEContentLoaded/
            document.documentElement.doScroll('left');
            fireHandlers();
        } catch (e) {
            setTimeout(doScrollCheck, 1);
        }
    }

    if (!eventFired) {
        if (document.addEventListener) {
            // use the real event for browsers that support it (all modern browsers support it)
            document.addEventListener('DOMContentLoaded', fireHandlers, false);

            // a fallback to window.onload, that will always work
            global.addEventListener('load', fireHandlers, false);
        } else {
            // ensure firing before onload,
            // maybe late but safe also for iframes
            document.attachEvent('onreadystatechange', fireHandlers);

            // a fallback to window.onload, that will always work
            global.attachEvent('onload', fireHandlers);

            // if not a frame continually check to see if the document is ready
            try {
                if (!global.frameElement && document.documentElement.doScroll) {
                    doScrollCheck();
                }
            } catch (e) {}
        }
    }

    // return attach function
    return function(callback, context) {
        // if no ready handlers yet and no event fired,
        // set timer to run handlers async
        if (!readyHandlers.length && eventFired && !timer) {
            timer = setTimeout(processReadyHandler, 0);
        }

        // add handler to queue
        readyHandlers.push([callback, context]);
    };
})();

function waitForGlobal(name, onDetect) {
    var detectRetry = 50;
    ready(function tryToDetect() {
        if (name in global === false) {
            if (detectRetry < 500) {
                setTimeout(tryToDetect, detectRetry);
            } else {
                consoleMethods.warn('[rempl][waitForGlobal] `' + name + '` doesn\'t detected');
            }

            detectRetry += 100;
            return;
        }

        onDetect(global[name]);
    });
}

var consoleMethods = (function() {
    var console = global.console;
    var methods = {
        log: function() {},
        info: function() {},
        warn: function() {},
        error: function() {}
    };

    if (console) {
        for (var methodName in methods) {
            methods[methodName] = 'bind' in Function.prototype && typeof console[methodName] == 'function'
                ? Function.prototype.bind.call(console[methodName], console)
                // IE8 and lower solution. It's also more safe when Function.prototype.bind
                // defines by other libraries (like es5-shim).
                : function() {
                    Function.prototype.apply.call(console[methodName], console, arguments);
                };
        }
    }

    return methods;
})();

module.exports = {
    complete: complete,
    slice: slice,
    genUID: genUID,
    ready: ready,
    waitForGlobal: waitForGlobal,
    log: consoleMethods.log,
    info: consoleMethods.info,
    warn: consoleMethods.warn,
    error: consoleMethods.error
};
