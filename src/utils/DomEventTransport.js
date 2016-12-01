/* eslint-env browser */
/* global CustomEvent */

var utils = require('./index.js');
var Token = require('./Token.js');
var global = new Function('return this')();
var document = global.document;
var DEBUG = true;
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

function subscribe(observer, fn) {
    this.subscribers.push(fn);
}

function send(observer) {
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
        event: 'data',
        callback: callback,
        data: args
    });
}

function wrapCallback(channel, callback) {
    return function() {
        emitEvent(channel.outputChannelId, {
            event: 'callback',
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
        //         event: 'features',
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
            utils.log('[rempl][dom-event-transport] recieve from ' + this.connectTo, data.event, data);
        }

        switch (data.event) {
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

                console.log(this.name, this.subscribers);
                this.subscribers.forEach(function(item) {
                    item.apply(null, args);
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
                utils.warn('[rempl][dom-event-transport] Unknown message type `' + data.event + '` for `' + name + '`', data);
        }
    }.bind(this));

    handshake(this);
}

DomEventTransport.prototype = {
    onInit: function(observer, callback) {
        if (this.inited) {
            callback({
                // setFeatures: features.set.bind(features),
                connected: this.connected,
                subscribe: subscribe.bind(this, observer),
                send: send.bind(this, observer)
            });
        } else {
            this.initCallbacks.push(arguments);
        }
    }
};

module.exports = DomEventTransport;
