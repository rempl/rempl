/* eslint-env browser */
/* global CustomEvent */

var hasOwnProperty = Object.prototype.hasOwnProperty;
var Token = require("../classes/Token.js");
var EndpointList = require("../classes/EndpointList.js");
var EndpointListSet = require("../classes/EndpointListSet.js");
var utils = require("../utils/index.js");
var DEBUG = false;
var DEBUG_PREFIX = "[rempl][event-transport] ";

function EventTransport(name, connectTo, win) {
    EventTransport.all.push(this);

    this.name = name;
    this.connectTo = connectTo;

    this.inputChannelId = name + ":" + utils.genUID();
    this.connections = Object.create(null);

    this.connected = new Token(false);
    this.endpointGetUI = {};
    this.ownEndpoints = new EndpointList();
    this.remoteEndpoints = new EndpointListSet();

    this.ownEndpoints.on(function (endpoints) {
        if (this.connected.value) {
            this.send({
                type: "endpoints",
                data: [endpoints],
            });
        }
    }, this);

    this.initCallbacks = [];
    this.dataCallbacks = [];
    this.sendCallbacks = {};
    this.inited = false;
    this.onInit = this.onInit.bind(this);
    this.window = win || global;

    if (
        typeof this.window.postMessage !== "function" ||
        typeof addEventListener !== "function"
    ) {
        utils.warn(
            DEBUG_PREFIX + "Event (postMessage) transport isn't supported"
        );
        return;
    }

    addEventListener(
        "message",
        function (e) {
            this._onMessage(e);
        }.bind(this),
        false
    );
    this._handshake(false);
}

EventTransport.all = [];
EventTransport.get = function (name, connectTo, win) {
    if (!win) {
        win = global;
    }

    for (var i = 0; i < EventTransport.all.length; i++) {
        var transport = EventTransport.all[i];
        if (
            transport.connectTo === connectTo &&
            transport.window === win &&
            transport.name === name
        ) {
            return transport;
        }
    }

    return new EventTransport(name, connectTo, win);
};

EventTransport.prototype = {
    _handshake: function (inited) {
        this._send(this.connectTo + ":connect", {
            initiator: this.name,
            inited: inited,
            endpoints: this.ownEndpoints.value,
        });
    },
    _onMessage: function (event) {
        var data = event.data || {};
        var payload = data.payload || {};

        if (event.source !== this.window || event.target !== global) {
            return;
        }

        switch (data.to) {
            case this.name + ":connect":
                if (payload.initiator === this.connectTo) {
                    this._onConnect(data.from, payload);
                }
                break;

            case this.inputChannelId:
                if (data.from in this.connections) {
                    this._onData(data.from, payload);
                } else {
                    utils.warn(
                        DEBUG_PREFIX + "unknown incoming connection",
                        data.from
                    );
                }
                break;
        }
    },
    _onConnect: function (from, payload) {
        if (!payload.inited) {
            this._handshake(true);
        }

        if (from in this.connections === false) {
            var endpoints = new EndpointList(payload.endpoints);
            this.remoteEndpoints.add(endpoints);
            this.connections[from] = {
                ttl: Date.now(),
                endpoints: endpoints,
            };
            this._send(from, {
                type: "connect",
                endpoints: this.ownEndpoints.value,
            });
        }

        this.inited = true;
    },
    _onData: function (from, payload) {
        if (DEBUG) {
            utils.log(
                DEBUG_PREFIX + "receive from " + this.connectTo,
                payload.type,
                payload
            );
        }

        switch (payload.type) {
            case "connect":
                this.connections[from].endpoints.set(payload.endpoints);
                this.connected.set(true);
                this.initCallbacks.splice(0).forEach(function (args) {
                    this.onInit.apply(this, args);
                }, this);
                break;

            case "endpoints":
                this.connections[from].endpoints.set(payload.data[0]);
                break;

            case "disconnect":
                this.connections[from].endpoints.set([]);
                this.connected.set(false);
                break;

            case "callback":
                if (hasOwnProperty.call(this.sendCallbacks, payload.callback)) {
                    this.sendCallbacks[payload.callback].apply(
                        null,
                        payload.data
                    );
                    delete this.sendCallbacks[payload.callback];
                }
                break;

            case "data":
                var args = Array.prototype.slice.call(payload.data);
                var callback = payload.callback;

                if (callback) {
                    args = args.concat(this._wrapCallback(from, callback));
                }

                this.dataCallbacks.forEach(function (callback) {
                    if (callback.endpoint === payload.endpoint) {
                        callback.fn.apply(null, args);
                    }
                });
                break;

            case "getRemoteUI":
                if (
                    !hasOwnProperty.call(this.endpointGetUI, payload.endpoint)
                ) {
                    utils.warn(
                        DEBUG_PREFIX +
                            "receive unknown endpoint for getRemoteUI(): " +
                            payload.endpoint
                    );
                    this._wrapCallback(
                        from,
                        payload.callback
                    )("Wrong endpoint – " + payload.endpoint);
                } else {
                    this.endpointGetUI[payload.endpoint](
                        payload.data[0] || false,
                        payload.callback
                            ? this._wrapCallback(from, payload.callback)
                            : Function
                    );
                }
                break;

            default:
                utils.warn(
                    DEBUG_PREFIX +
                        "Unknown message type `" +
                        payload.type +
                        "` for `" +
                        this.name +
                        "`",
                    payload
                );
        }
    },

    _wrapCallback: function (to, callback) {
        return function () {
            this._send(to, {
                type: "callback",
                callback: callback,
                data: Array.prototype.slice.call(arguments),
            });
        }.bind(this);
    },
    _send: function (to, payload) {
        if (DEBUG) {
            utils.log(DEBUG_PREFIX + "emit event", to, payload);
        }

        if (typeof this.window.postMessage === "function") {
            this.window.postMessage(
                {
                    from: this.inputChannelId,
                    to: to,
                    payload: payload,
                },
                "*"
            );
        }
    },

    subscribeToEndpoint: function (endpoint, fn) {
        return utils.subscribe(this.dataCallbacks, {
            endpoint: endpoint,
            fn: fn,
        });
    },
    sendToEndpoint: function (endpoint, type) {
        // if (endpoint !== this.remoteName && this.remoteEndpoints.value.indexOf(endpoint) === -1) {
        //     // console.warn(this.name, endpoint, this.remoteName, this.remoteEndpoints.value);
        //     if (1||DEBUG) {
        //         utils.warn(DEBUG_PREFIX + '' + this.name + ' send({ type: `' + type + '` }) to endpoint is cancelled since no `' + endpoint + '` in remote endpoint list [' + this.remoteEndpoints.value.join(', ') + ']', arguments[2]);
        //     }
        //     return;
        // }

        var args = Array.prototype.slice.call(arguments, 2);
        var callback = false;

        if (args.length && typeof args[args.length - 1] === "function") {
            callback = utils.genUID();
            this.sendCallbacks[callback] = args.pop();
        }

        this.send({
            type: type,
            endpoint: endpoint,
            data: args,
            callback: callback,
        });
    },
    send: function (payload) {
        // if (!this.inited) {
        //     utils.warn(DEBUG_PREFIX + 'send() call on init is prohibited');
        //     return;
        // }

        for (var channelId in this.connections) {
            this._send(channelId, payload);
        }
    },

    onInit: function (endpoint, callback) {
        var id = endpoint.id || null;

        if (id) {
            this.ownEndpoints.set(this.ownEndpoints.value.concat(id));
            if (typeof endpoint.getRemoteUI === "function") {
                this.endpointGetUI[id] = endpoint.getRemoteUI;
            }
        }

        if (this.inited) {
            callback({
                connected: this.connected,
                getRemoteUI: this.sendToEndpoint.bind(this, id, "getRemoteUI"),
                subscribe: this.subscribeToEndpoint.bind(this, id),
                send: this.sendToEndpoint.bind(this, id, "data"),
            });
        } else {
            this.initCallbacks.push(arguments);
        }

        return this;
    },
    sync: function (endpoint) {
        var channel = utils.genUID(8) + ":" + this.connectTo;
        var remoteEndpoints = this.remoteEndpoints;

        this.onInit(endpoint, function (api) {
            api.subscribe(endpoint.processInput);
            api.connected.link(function (connected) {
                endpoint.setupChannel(
                    channel,
                    api.send,
                    remoteEndpoints,
                    connected
                );
            });
        });

        return this;
    },
};

module.exports = EventTransport;
