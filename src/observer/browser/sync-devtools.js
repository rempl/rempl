var DEBUG = false;
var PREFIX = 'basisjsDevpanel';  // TODO: rename to rempl
var DEVTOOL_PREFIX = 'basisjs-devpanel'; // TODO: rename to rempl
var utils = require('../../utils/index.js');
var document = global.document;
var connected = new utils.Value(false);
var features = new utils.Value([]);
var inputChannelId = PREFIX + ':' + utils.genUID();
var outputChannelId;
var initCallbacks = [];
var callbacks = {};
var subscribers = [];
var inited = false;
var send;

var subscribe = function(fn) {
    subscribers.push(fn);
};
var send = function() {
    if (!inited) {
        utils.warn('[rempl][sync-devtools] Cross-process messaging is not inited');
    }
};

function init(observer, callback) {
    if (inited) {
        callback({
            setFeatures: features.set.bind(features),
            connected: connected,
            subscribe: subscribe,
            send: send
        });
    } else {
        initCallbacks.push(callback);
    }
}

function emitEvent(channelId, data) {
    if (DEBUG) {
        console.log('[rempl][sync-devtools] emit event', channelId, data);
    }

    // IE does not support CustomEvent constructor
    if (typeof document.createEvent === 'function') {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(channelId, false, false, data);
        document.dispatchEvent(event);
    } else {
        document.dispatchEvent(new CustomEvent(channelId, {
            detail: data
        }));
    }
}

function wrapCallback(callback) {
    return function() {
        emitEvent(outputChannelId, {
            event: 'callback',
            callback: callback,
            data: utils.slice(arguments)
        });
    };
}

function handshake() {
    emitEvent(DEVTOOL_PREFIX + ':init', {
        input: inputChannelId,
        output: outputChannelId,
        features: features.value
    });
}

if (document.createEvent) {
    document.addEventListener(DEVTOOL_PREFIX + ':connect', function(e) {
        if (outputChannelId) {
            return;
        }

        var data = e.detail;
        outputChannelId = data.input;

        if (!data.output) {
            handshake();
        }

        send = function() {
            // console.log('[devpanel] send to devtools', arguments);
            var args = utils.slice(arguments);
            var callback = false;

            if (args.length && typeof args[args.length - 1] === 'function') {
                // TODO: deprecate (drop) callback after some time to avoid memory leaks
                callback = utils.genUID();
                callbacks[callback] = args.pop();
            }

            emitEvent(outputChannelId, {
                event: 'data',
                callback: callback,
                data: args
            });
        };

        // send features to devtools
        features.attach(function(features) {
            emitEvent(outputChannelId, {
                event: 'features',
                data: [features]
            });
        });

        // invoke onInit callbacks
        inited = true;
        initCallbacks.splice(0).forEach(init);
    });

    // devtools -> devpanel
    document.addEventListener(inputChannelId, function(e) {
        var data = e.detail;

        if (DEBUG) {
            console.log('[rempl][sync-devtools] recieve from devtools', data.event, data);
        }

        switch (data.event) {
            case 'connect':
                connected.set(true);
                break;

            case 'disconnect':
                connected.set(false);
                break;

            case 'callback':
                if (callbacks.hasOwnProperty(data.callback)) {
                    callbacks[data.callback].apply(null, data.data);
                    delete callbacks[data.callback];
                }
                break;

            case 'data':
                var args = utils.slice(data.data);
                var callback = data.callback;

                if (callback) {
                    args = args.concat(wrapCallback(callback));
                }

                subscribers.forEach(function(item) {
                    item.apply(null, args);
                });
                break;

            case 'getInspectorUI': // legacy of basis.js plugin // TODO: remove
            case 'getRemoteUI':
                getRemoteUI(
                    utils.slice(data.data)[0] || false,
                    data.callback ? wrapCallback(data.callback) : Function
                );
                break;

            default:
                utils.warn('[rempl][sync-devtools] Unknown message type `' + data.event + '`', data);
        }
    });

    handshake();
} else {
    send = function() {
        utils.warn('[rempl][sync-devtools] Cross-process messaging is not supported');
    };
}

module.exports = {
    onInit: init,
    connected: connected,
    subscribe: subscribe,
    send: send
};
