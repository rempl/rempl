'use strict';

var isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]' &&
            (typeof self === 'undefined' || Object.prototype.toString.call(self) !== '[object Window]');

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

function subscribe(list, item) {
    list.push(item);

    return function() {
        var idx = list.indexOf(item);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
    };
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
    isNode: isNode,
    complete: complete,
    slice: slice,
    genUID: genUID,
    subscribe: subscribe,
    log: consoleMethods.log,
    info: consoleMethods.info,
    warn: consoleMethods.warn,
    error: consoleMethods.error
};
