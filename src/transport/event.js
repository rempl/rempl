/* eslint-env browser */
/* global CustomEvent */

var hasOwnProperty = Object.prototype.hasOwnProperty;
var Token = require('../classes/Token.js');
var utils = require('../utils/index.js');
var instances = [];
var DEBUG = false;
var DEBUG_PREFIX = '[rempl][dom-event-transport] ';

function subscribe(endpoint, fn) {
    return utils.subscribe(this.dataCallbacks, {
        endpoint: endpoint,
        fn: fn
    });
}

function send(endpoint, type) {
    if (!this.inited) {
        utils.warn(DEBUG_PREFIX + 'send() call on init is prohibited');
        return;
    }

    // if (endpoint !== this.remoteName && this.remoteEndpoints.value.indexOf(endpoint) === -1) {
    //     // console.warn(this.name, endpoint, this.remoteName, this.remoteEndpoints.value);
    //     if (1||DEBUG) {
    //         utils.warn(DEBUG_PREFIX + '' + this.name + ' send({ type: `' + type + '` }) to endpoint is cancelled since no `' + endpoint + '` in remote endpoint list [' + this.remoteEndpoints.value.join(', ') + ']', arguments[2]);
    //     }
    //     return;
    // }

    var args = Array.prototype.slice.call(arguments, 2);
    var callback = false;

    if (args.length && typeof args[args.length - 1] === 'function') {
        callback = utils.genUID();
        this.sendCallbacks[callback] = args.pop();
    }

    this.send(this.outputChannelId, {
        type: type,
        endpoint: endpoint,
        data: args,
        callback: callback
    });
}

function handshake(transport) {
    transport.send(transport.name + ':connect', {
        input: transport.inputChannelId,
        output: transport.outputChannelId,
        endpoints: transport.ownEndpoints.value
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

function setEndpointList(endpoints, value) {
    var oldList = endpoints.value;
    var newList = value.filter(function(endpoint, idx, array) { // unique values
        return idx === 0 || array.lastIndexOf(endpoint, idx - 1) === -1;
    });
    var diff = newList.length !== oldList.length
            || newList.every(function(endpoint) {
                return oldList.indexOf(endpoint) !== -1;
            });

    if (diff) {
        endpoints.set(newList);
    }
}

function onConnect(payload) {
    this.outputChannelId = payload.input;

    if (!payload.output) {
        handshake(this);
        // return;
    }

    setEndpointList(this.remoteEndpoints, payload.endpoints || []);
    this.ownEndpoints.on(function(endpoints) {
        this.send(this.outputChannelId, {
            type: 'endpoints',
            data: [endpoints]
        });
    }, this);

    // invoke onInit callbacks
    this.inited = true;
    this.send(this.outputChannelId, {
        type: 'connect'
    });
    this.initCallbacks.splice(0).forEach(function(args) {
        this.onInit.apply(this, args);
    }, this);
}

function onData(payload) {
    if (DEBUG) {
        utils.log(DEBUG_PREFIX + 'receive from ' + this.connectTo, payload.type, payload);
    }

    switch (payload.type) {
        case 'connect':
            this.connected.set(true);
            break;

        case 'disconnect':
            this.connected.set(false);
            setEndpointList(this.remoteEndpoints, []);
            break;

        case 'callback':
            if (hasOwnProperty.call(this.sendCallbacks, payload.callback)) {
                this.sendCallbacks[payload.callback].apply(null, payload.data);
                delete this.sendCallbacks[payload.callback];
            }
            break;

        case 'data':
            var args = Array.prototype.slice.call(payload.data);
            var callback = payload.callback;

            if (callback) {
                args = args.concat(wrapCallback(this, callback));
            }

            this.dataCallbacks.forEach(function(callback) {
                if (callback.endpoint === payload.endpoint) {
                    callback.fn.apply(null, args);
                }
            });
            break;

        case 'getRemoteUI':
            if (!hasOwnProperty.call(this.endpointGetUI, payload.endpoint)) {
                utils.warn(DEBUG_PREFIX + 'receive unknown endpoint for getRemoteUI(): ' + payload.endpoint);
                wrapCallback(this, payload.callback)('Wrong endpoint – ' + payload.endpoint);
            } else {
                this.endpointGetUI[payload.endpoint](
                    payload.data[0] || false,
                    payload.callback ? wrapCallback(this, payload.callback) : Function
                );
            }
            break;

        case 'endpoints':
            setEndpointList(this.remoteEndpoints, payload.data[0]);
            break;

        default:
            utils.warn(DEBUG_PREFIX + 'Unknown message type `' + payload.type + '` for `' + name + '`', payload);
    }
}

function EventTransport(name, connectTo, win) {
    this.name = name;
    this.connectTo = connectTo;

    this.inputChannelId = name + ':' + utils.genUID();
    this.outputChannelId = null;

    this.connected = new Token(false);
    this.ownEndpoints = new Token([]);
    this.remoteEndpoints = new Token([]);
    this.endpointGetUI = {};

    // this.ownEndpoints.on(function(value) {
    //     console.log('>>>', this.name, this.connectTo, value, window.location.href);
    // }, this);
    // this.remoteEndpoints.on(function(value) {
    //     console.log('<<<', this.name, this.connectTo, value, window.location.href);
    // }, this);

    this.initCallbacks = [];
    this.dataCallbacks = [];
    this.sendCallbacks = {};
    this.inited = false;
    this.onInit = this.onInit.bind(this);
    this.window = win || global;

    if (typeof this.window.postMessage !== 'function') {
        utils.warn(DEBUG_PREFIX + 'Event (postMessage) transport isn\'t supported');
        return;
    }

    addEventListener('message', function(e) {
        var data = e.data || {};

        if (typeof this._debug === 'function') {
            this._debug(e.data);
        }

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

EventTransport.create = function(name, connectTo, win) {
    if (!win) {
        win = global;
    }

    for (var i = 0; i < instances.length; i++) {
        var instance = instances[i];
        if (instance.connectTo === connectTo &&
            instance.window === win &&
            instance.name === name) {
            return instance;
        }
    }

    var instance = new EventTransport(name, connectTo, win);
    instances.push(instance);
    return instance;
};

EventTransport.prototype = {
    onInit: function(endpoint, callback) {
        var id = endpoint.id || null;

        if (id) {
            setEndpointList(this.ownEndpoints, this.ownEndpoints.value.concat(id));
            if (typeof endpoint.getRemoteUI === 'function') {
                this.endpointGetUI[id] = endpoint.getRemoteUI;
            }
        }

        if (this.inited) {
            callback({
                connected: this.connected,
                getRemoteUI: send.bind(this, id, 'getRemoteUI'),
                subscribe: subscribe.bind(this, id),
                send: send.bind(this, id, 'data')
            });
        } else {
            this.initCallbacks.push(arguments);
        }

        return this;
    },

    sync: function(endpoint) {
        var channel = this.connectTo;
        this.onInit(endpoint, function(api) {
            api.subscribe(endpoint.processInput);
            api.connected.link(function(connected) {
                endpoint.setupChannel(channel, api.send, connected);
            });
        });
    },

    send: function(channelId, payload) {
        if (DEBUG) {
            utils.log(DEBUG_PREFIX + 'emit event', channelId, payload);
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
