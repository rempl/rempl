/* eslint-env browser */
/* global CustomEvent */

var hasOwnProperty = Object.prototype.hasOwnProperty;
var Token = require('../classes/Token.js');
var utils = require('../utils/index.js');
var DEBUG = false;

function subscribe(endpoint, fn) {
    return utils.subscribe(this.subscribers, {
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

    this.send(this.outputChannelId, {
        type: 'data',
        endpoint: endpoint,
        callback: callback,
        data: args
    });
}

function handshake(transport) {
    transport.send(transport.name + ':connect', {
        name: transport.remoteName,  // FIXME: temporary solution to pass subscriber name from sandbox
        input: transport.inputChannelId,
        output: transport.outputChannelId,
        publishers: transport.publishers
    });
}

function wrapCallback(transport, callback) {
    return function() {
        transport.send(transport.outputChannelId, {
            type: 'callback',
            callback: callback,
            data: Array.prototype.slice.call(arguments)
        });
    };
}

function onConnect(payload) {
    if (this.outputChannelId !== null) {
        return;
    }

    this.outputChannelId = payload.input;

    if (!payload.output) {
        handshake(this);
    }

    if (payload.name && !this.remoteName) { // FIXME: temporary solution to pass subscriber name from sandbox
        this.remoteName = payload.name;
    }

    this.endpoints.on(function(publishers) {
        this.send(this.outputChannelId, {
            type: 'publishers',
            data: [publishers]
        });
    }, this);

    // invoke onInit callbacks
    this.inited = true;
    this.initCallbacks.splice(0).forEach(function(args) {
        this.onInit.apply(this, args);
    }, this);
}

function onData(payload) {
    if (DEBUG) {
        utils.log('[rempl][dom-event-transport] receive from ' + this.connectTo, payload.type, payload);
    }

    switch (payload.type) {
        case 'connect':
            this.connected.set(true);
            break;

        case 'disconnect':
            this.connected.set(false);
            break;

        case 'callback':
            if (hasOwnProperty.call(this.callbacks, payload.callback)) {
                this.callbacks[payload.callback].apply(null, payload.data);
                delete this.callbacks[payload.callback];
            }
            break;

        case 'data':
            var args = Array.prototype.slice.call(payload.data);
            var callback = payload.callback;

            if (callback) {
                args = args.concat(wrapCallback(this, callback));
            }

            this.subscribers.forEach(function(subscriber) {
                if (subscriber.endpoint === payload.endpoint) {
                    subscriber.fn.apply(null, args);
                }
            });
            break;

        case 'getRemoteUI':
            if (!hasOwnProperty.call(this.endpointGetUI, payload.endpoint)) {
                utils.warn('[rempl][dom-event-transport] receive unknown endpoint for getRemoteUI(): ' + payload.endpoint);
                wrapCallback(this, payload.callback)('Wrong endpoint – ' + payload.endpoint);
            } else {
                this.endpointGetUI[payload.endpoint](
                    payload.data[0] || false,
                    payload.callback ? wrapCallback(this, payload.callback) : Function
                );
            }
            break;

        case 'publishers':
            // nothing to do for now
            break;

        default:
            utils.warn('[rempl][dom-event-transport] Unknown message type `' + payload.type + '` for `' + name + '`', payload);
    }
}

function EventTransport(name, connectTo, options) {
    if (!options) {
        options = {};
    }

    this.name = name;
    this.connectTo = connectTo;
    this.remoteName = options.name || null; // FIXME: temporary solution to pass subscriber name from sandbox

    this.inputChannelId = name + ':' + utils.genUID();
    this.outputChannelId = null;

    this.connected = new Token(true); // TODO: set false by default
    this.endpoints = new Token([]);
    this.endpointGetUI = {};

    this.initCallbacks = [];
    this.callbacks = {};
    this.subscribers = [];
    this.inited = false;
    this.onInit = this.onInit.bind(this);
    this.window = options.window || global;

    if (typeof this.window.postMessage !== 'function') {
        utils.warn('[rempl][dom-event-transport] Event (postMessage) transport isn\'t supported');
        return;
    }

    addEventListener('message', function(e) {
        var data = e.data || {};

        switch (data.channel) {
            case this.connectTo + ':connect':
                onConnect.call(this, data.payload || {});
                break;

            case this.inputChannelId:
                onData.call(this, data.payload || {});
                break;
        }
    }.bind(this), false);

    handshake(this);
}

EventTransport.prototype = {
    onInit: function(endpoint, callback) {
        if (this.inited) {
            if (!endpoint.id && this.remoteName) { // FIXME: temporary solution to pass subscriber name from sandbox
                endpoint.id = this.remoteName;
            }

            this.endpoints.set(this.endpoints.value.concat(endpoint.id));
            if (typeof endpoint.getRemoteUI === 'function') {
                this.endpointGetUI[endpoint.id] = endpoint.getRemoteUI;
            }

            callback({
                connected: this.connected,
                subscribe: subscribe.bind(this, endpoint.id),
                send: send.bind(this, endpoint.id)
            });
        } else {
            this.initCallbacks.push(arguments);
        }
    },

    send: function(channelId, payload) {
        if (DEBUG) {
            utils.log('[rempl][dom-event-transport] emit event', channelId, payload);
        }

        if (typeof this.window.postMessage === 'function') {
            this.window.postMessage({
                channel: channelId,
                payload: payload
            }, '*');
        }
    }
};

module.exports = EventTransport;
