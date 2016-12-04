/* eslint-env browser */
/* global CustomEvent */

var utils = require('./index.js');
var Token = require('./Token.js');
var global = new Function('return this')();
var document = global.document;
var DEBUG = false;
// var getRemoteUI = require('./getRemoteUI.js');

function emitEvent(channelId, data) {
    if (DEBUG) {
        utils.log('[rempl][dom-event-transport] emit event', channelId, data);
    }

    // IE does not support CustomEvent constructor
    if (typeof document.createEvent == 'function') {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(channelId, false, false, data);
        document.dispatchEvent(event);
    } else {
        document.dispatchEvent(new CustomEvent(channelId, {
            detail: data
        }));
    }
}

function handshake(channel) {
    emitEvent(channel.name + ':connect', {
        input: channel.inputChannelId,
        output: channel.outputChannelId,
        features: channel.features.value
    });
}

function subscribe(endpoint, fn) {
    this.subscribers.push({
        endpoint: endpoint,
        fn: fn
    });
}

function send(endpoint) {
    if (!this.inited) {
        utils.warn('[rempl][dom-event-transport] send() call on init is prohibited');
        return;
    }

    // utils.log('[devpanel] send to devtools', arguments);
    var args = Array.prototype.slice.call(arguments, 1);
    var callback = false;

    if (args.length && typeof args[args.length - 1] === 'function') {
        callback = utils.genUID();
        this.callbacks[callback] = args.pop();
    }

    emitEvent(this.outputChannelId, {
        type: 'data',
        endpoint: endpoint,
        callback: callback,
        data: args
    });
}

function wrapCallback(channel, callback) {
    return function() {
        emitEvent(channel.outputChannelId, {
            type: 'callback',
            callback: callback,
            data: Array.prototype.slice.call(arguments)
        });
    };
}

function DomEventTransport(name, connectTo) {
    this.name = name;
    this.connectTo = connectTo;

    this.inputChannelId = name + ':' + utils.genUID();
    this.outputChannelId = null;

    this.connected = new Token(true); // TODO: set false by default
    this.features = new Token([]);

    this.initCallbacks = [];
    this.callbacks = {};
    this.subscribers = [];
    this.inited = false;
    this.onInit = this.onInit.bind(this);

    if (!document || !document.createEvent) {
        utils.warn('[rempl][dom-event-transport] Event transport isn\'t supported');
        return;
    }

    document.addEventListener(this.connectTo + ':connect', function(e) {
        if (this.outputChannelId) {
            return;
        }

        var data = e.detail;
        this.outputChannelId = data.input;

        if (!data.output) {
            handshake(this);
        }

        // send features to devtools
        // features.attach(function(features){
        //     emitEvent(outputChannelId, {
        //         type: 'features',
        //         data: [features]
        //     });
        // });

        // invoke onInit callbacks
        this.inited = true;
        this.initCallbacks.splice(0).forEach(function(args) {
            this.onInit.apply(this, args);
        }, this);
    }.bind(this));

    document.addEventListener(this.inputChannelId, function(e) {
        var data = e.detail;

        if (DEBUG) {
            utils.log('[rempl][dom-event-transport] recieve from ' + this.connectTo, data.type, data);
        }

        switch (data.type) {
            case 'connect':
                this.connected.set(true);
                break;

            case 'disconnect':
                this.connected.set(false);
                break;

            case 'callback':
                if (this.callbacks.hasOwnProperty(data.callback)) {
                    this.callbacks[data.callback].apply(null, data.data);
                    delete this.callbacks[data.callback];
                }
                break;

            case 'data':
                var args = Array.prototype.slice.call(data.data);
                var callback = data.callback;

                if (callback) {
                    args = args.concat(wrapCallback(callback));
                }

                this.subscribers.forEach(function(subscriber) {
                    if (subscriber.endpoint === data.endpoint) {
                        subscriber.fn.apply(null, args);
                    }
                });
                break;

            case 'getInspectorUI': // legacy
            case 'getRemoteUI':
                getRemoteUI(
                    Array.prototype.slice.call(data.data)[0] || false,
                    data.callback ? wrapCallback(data.callback) : Function
                );
                break;

            default:
                utils.warn('[rempl][dom-event-transport] Unknown message type `' + data.type + '` for `' + name + '`', data);
        }
    }.bind(this));

    handshake(this);
}

DomEventTransport.prototype = {
    onInit: function(endpoint, callback) {
        if (this.inited) {
            callback({
                // setFeatures: features.set.bind(features),
                connected: this.connected,
                subscribe: subscribe.bind(this, endpoint.id),
                send: send.bind(this, endpoint.id)
            });
        } else {
            this.initCallbacks.push(arguments);
        }
    }
};

module.exports = DomEventTransport;
