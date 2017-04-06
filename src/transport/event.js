/* eslint-env browser */
/* global CustomEvent */

var hasOwnProperty = Object.prototype.hasOwnProperty;
var Token = require('../classes/Token.js');
var EndpointList = require('../classes/EndpointList.js');
var utils = require('../utils/index.js');
var instances = [];
var DEBUG = false;
var DEBUG_PREFIX = '[rempl][event-transport] ';

function EventTransport(name, connectTo, win) {
    this.name = name;
    this.connectTo = connectTo;

    this.inputChannelId = name + ':' + utils.genUID();
    this.outputChannelId = null;

    this.connected = new Token(false);
    this.endpointGetUI = {};
    this.ownEndpoints = new EndpointList();
    this.remoteEndpoints = new EndpointList();

    this.ownEndpoints.on(function(endpoints) {
        if (this.connected.value) {
            this.send({
                type: 'endpoints',
                data: [endpoints]
            });
        }
    }, this);

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

    if (typeof this.window.postMessage !== 'function' ||
        typeof addEventListener !== 'function') {
        utils.warn(DEBUG_PREFIX + 'Event (postMessage) transport isn\'t supported');
        return;
    }

    addEventListener('message', this._onMessage.bind(this), false);
    this._handshake();
}

EventTransport.get = function(name, connectTo, win) {
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
    _handshake: function() {
        this._send(this.name + ':connect', {
            connectTo: this.connectTo,
            input: this.inputChannelId,
            output: this.outputChannelId,
            endpoints: this.ownEndpoints.value
        });
    },
    _onMessage: function(e) {
        var data = e.data || {};
        var payload = data.payload || {};

        switch (data.channel) {
            case this.connectTo + ':connect':
                if (payload.connectTo === this.name) {
                    this._onConnect(payload);
                }
                break;

            case this.inputChannelId:
                this._onData(payload);
                break;
        }
    },
    _onConnect: function(payload) {
        this.outputChannelId = payload.input;

        if (!payload.output) {
            this._handshake();
        }

        if (!this.inited) {
            this.remoteEndpoints.set(payload.endpoints);

            // invoke onInit callbacks
            this.inited = true;
            this.send({
                type: 'connect',
                data: [this.ownEndpoints.value]
            });
        }
    },
    _onData: function(payload) {
        if (DEBUG) {
            utils.log(DEBUG_PREFIX + 'receive from ' + this.connectTo, payload.type, payload);
        }

        switch (payload.type) {
            case 'connect':
                this.remoteEndpoints.set(payload.data && payload.data[0]);
                this.connected.set(true);
                this.initCallbacks.splice(0).forEach(function(args) {
                    this.onInit.apply(this, args);
                }, this);
                break;

            case 'disconnect':
                this.remoteEndpoints.set([]);
                this.connected.set(false);
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
                    args = args.concat(this._wrapCallback(callback));
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
                    this._wrapCallback(payload.callback)('Wrong endpoint – ' + payload.endpoint);
                } else {
                    this.endpointGetUI[payload.endpoint](
                        payload.data[0] || false,
                        payload.callback ? this._wrapCallback(payload.callback) : Function
                    );
                }
                break;

            case 'endpoints':
                this.remoteEndpoints.set(payload.data[0]);
                break;

            default:
                utils.warn(DEBUG_PREFIX + 'Unknown message type `' + payload.type + '` for `' + this.name + '`', payload);
        }
    },

    _wrapCallback: function(callback) {
        return function() {
            this.send({
                type: 'callback',
                callback: callback,
                data: Array.prototype.slice.call(arguments)
            });
        }.bind(this);
    },
    _send: function(channelId, payload) {
        if (DEBUG) {
            utils.log(DEBUG_PREFIX + 'emit event', channelId, payload);
        }

        if (typeof this.window.postMessage === 'function') {
            this.window.postMessage({
                channel: channelId,
                payload: payload
            }, '*');
        }
    },

    subscribeToEndpoint: function(endpoint, fn) {
        return utils.subscribe(this.dataCallbacks, {
            endpoint: endpoint,
            fn: fn
        });
    },
    sendToEndpoint: function(endpoint, type) {
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

        this.send({
            type: type,
            endpoint: endpoint,
            data: args,
            callback: callback
        });
    },
    send: function(payload) {
        this._send(this.outputChannelId, payload);
    },

    onInit: function(endpoint, callback) {
        var id = endpoint.id || null;

        if (id) {
            this.ownEndpoints.set(this.ownEndpoints.value.concat(id));
            if (typeof endpoint.getRemoteUI === 'function') {
                this.endpointGetUI[id] = endpoint.getRemoteUI;
            }
        }

        if (this.inited) {
            callback({
                connected: this.connected,
                getRemoteUI: this.sendToEndpoint.bind(this, id, 'getRemoteUI'),
                subscribe: this.subscribeToEndpoint.bind(this, id),
                send: this.sendToEndpoint.bind(this, id, 'data')
            });
        } else {
            this.initCallbacks.push(arguments);
        }

        return this;
    },
    sync: function(endpoint) {
        var channel = utils.genUID(8) + ':' + this.connectTo;
        this.onInit(endpoint, function(api) {
            api.subscribe(endpoint.processInput);
            api.connected.link(function(connected) {
                endpoint.setupChannel(channel, api.send, connected);
            });
        });
        return this;
    }
};

module.exports = EventTransport;
