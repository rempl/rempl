(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RemplSubscriber = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var utils = require('../utils/index.js');
var instances = Object.create(null);

function send(subscriber, args) {
    for (var channel in subscriber.channels) {
        subscriber.channels[channel].apply(null, args);
    }
}

function invoke(method, args, callback) {
    if (!this.hasMethod(method)) {
        return utils.warn('[rempl] Unknown method:', method, this.methods);
    }

    if (typeof callback === 'function') {
        args = args.concat(callback);
    }

    this.methods[method].apply(null, args);
}

var Namespace = function(name, subscriber) {
    this.name = name;
    this.subscriber = subscriber;
    this.methods = Object.create(null);
    this.subscribers = [];
};

Namespace.prototype = {
    subscribe: function(fn) {
        this.subscribers.push(fn);
    },

    hasMethod: function(method) {
        return method in this.methods;
    },
    define: function(methods) {
        utils.complete(this.methods, methods);
    },
    invoke: function(method/*, ...args, callback*/) {
        var args = Array.prototype.slice.call(arguments, 1);
        var callback = null;

        if (args.length && typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }

        send(this.subscriber, [{
            type: 'call',
            ns: this.name,
            method: method,
            args: args
        }, callback]);
    }
};

var Subscriber = function(id) {
    this.id = id;
    this.namespaces = Object.create(null);
    this.channels = Object.create(null);
    this.processInput = this.processInput.bind(this);

    var defaultNS = this.ns('*');
    for (var method in defaultNS) {
        if (typeof defaultNS[method] === 'function') {
            this[method] = defaultNS[method].bind(defaultNS);
        }
    }
};

Subscriber.prototype = {
    ns: function getNamespace(name) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = new Namespace(name, this);
        }

        return this.namespaces[name];
    },
    processInput: function(packet, callback) {
        var ns = packet.ns || '*';

        switch (packet.type) {
            case 'call':
                if (!this.ns(ns).hasMethod(packet.method)) {
                    return console.warn('[rempl][sync] Subscriber `' + this.id + '` has no remote command `' + packet.method + '` in namespace `' + ns + '`');
                }

                invoke.call(this.ns(ns), packet.method, packet.args, callback);
                break;

            case 'data':
                this.ns(ns).subscribers.forEach(function(subscriber) {
                    subscriber(packet.payload);
                });
                break;

            default:
                utils.warn('[rempl][sync] Unknown packet type:', packet.type);
        }
    }
};

Subscriber.factory = function createSubscriberFactory(Subscriber) {
    return function getSubscriber(id, getRemoteUI, endpoint) {
        var subscriber = instances[id];

        if (!subscriber) {
            subscriber = instances[id] = new Subscriber(id, getRemoteUI, endpoint);
        }

        return subscriber;
    };
};

module.exports = Subscriber;

},{"../utils/index.js":2}],2:[function(require,module,exports){
'use strict';

var global = new Function('return this')();
var document = global.document;

function complete(dest, source) {
    for (var key in source) {
        if (key in dest === false) {
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

function link(token, fn, context) {
    token.attach(fn, context);
    fn.call(context, token.value);
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
    link: link,
    ready: ready,
    waitForGlobal: waitForGlobal,
    log: consoleMethods.log,
    info: consoleMethods.info,
    warn: consoleMethods.warn,
    error: consoleMethods.error
};

},{}]},{},[1])(1)
});