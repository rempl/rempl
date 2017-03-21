var Token = require('../classes/Token.js');
var utils = require('../utils');
var socketIO = require('socket.io-client');
var endpoints = Object.create(null);
var INFO_UPDATE_TIME = 100;
var DEBUG = false;

function valuesChanged(a, b) {
    for (var key in a) {
        var value1 = a[key];
        var value2 = b[key];

        if (Array.isArray(value1)) {
            if (valuesChanged(value1, value2)) {
                return true;
            }
        } else {
            if (String(value1) !== String(value2)) {
                return true;
            }
        }
    }

    return false;
}

function normalizeUri(uri) {
    uri = String(uri);

    if (/^\d+$/.test(uri)) {
        return 'ws://localhost:' + uri;
    }

    return uri.replace(/^([a-z]+:)\/\/|^/i, 'ws://');
}

function callMethod(obj, method) {
    return function() {
        return obj[method].apply(this, arguments);
    };
}

function onConnect() {
    clearInterval(this.sendInfoTimer);

    this.connected.set(true);
    this.info = this.getInfo();

    this.send('rempl:endpoint connect', this.info, function(data) {
        if ('id' in data) {
            this.setClientId(data.id);
        }

        this.sendInfoTimer = setInterval(this.sendInfo.bind(this), INFO_UPDATE_TIME);
    }.bind(this));

    if (DEBUG) {
        console.log('[rempl][ws-transport] connected');
    }
}

function onGetUI(id, settings, callback) {
    if (!this.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error('[rempl][ws-transport] Publisher `' + id + '` isn\'t registered on page');
        }

        callback('[rempl][ws-transport] Publisher `' + id + '` isn\'t registered on page');
        return;
    }

    this.publishersMap[id].getRemoteUI.call(null, settings || {}, callback);
}

function onData(id) {
    if (!this.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error('[rempl][ws-transport] Publisher `' + id + '` isn\'t registered on page');
        }

        return;
    }

    var subscribers = this.publishersMap[id].subscribers;
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < subscribers.length; i++) {
        subscribers[i].apply(null, args);
    }
}

function onDisconnect() {
    if (DEBUG) {
        console.log('[rempl] disconnected');
    }

    this.connected.set(false);

    clearInterval(this.sendInfoTimer);
    this.stopIdentify();
}

function WSTransport(uri) {
    this.sessionId = utils.genUID();
    this.id = null;

    this.sendInfoTimer = null;
    this.info = {};

    this.publishers = [];
    this.publishersMap = {};

    this.connected = new Token(false);

    if (DEBUG) {
        console.log('[rempl][ws-transport] connecting to ' + normalizeUri(uri));
    }

    this.transport = socketIO.connect(normalizeUri(uri))
        .on('connect', onConnect.bind(this))
        .on('disconnect', onDisconnect.bind(this))

        .on('rempl:get ui', onGetUI.bind(this))
        .on('rempl:to publisher', onData.bind(this))

        .on('rempl:identify', callMethod(this, 'startIdentify'))
        .on('rempl:stop identify', callMethod(this, 'stopIdentify'));
}

WSTransport.create = function(endpoint) {
    if (endpoint in endpoints) {
        return endpoints[endpoint];
    }

    return endpoints[endpoint] = new WSTransport(endpoint);
};

WSTransport.prototype.type = 'unknown';
WSTransport.prototype.infoFields = [
    'id',
    'sessionId',
    'type',
    'publishers'
];

WSTransport.prototype.setClientId = function(id) {
    this.id = id;
};

/**
 * Send data through WS
 */
WSTransport.prototype.send = function() {
    this.transport.emit.apply(this.transport, arguments);
};

/**
 * Get self info
 * @returns Object
 */
WSTransport.prototype.getInfo = function() {
    var result = {};

    this.infoFields.forEach(function(name) {
        result[name] = Array.isArray(this[name]) ? this[name].slice() : this[name];
    }, this);

    return result;
};

/**
 * Send self info to server
 */
WSTransport.prototype.sendInfo = function() {
    var newInfo = this.getInfo();

    if (valuesChanged(this.info, newInfo)) {
        this.info = newInfo;
        this.send('rempl:endpoint info', this.info);
    }
};

WSTransport.prototype.startIdentify = function() {
    if (DEBUG) {
        console.error('[rempl] #startIdentify not implemented');
    }
};

WSTransport.prototype.stopIdentify = function() {
    if (DEBUG) {
        console.error('[rempl] #stopIdentify not implemented');
    }
};

WSTransport.prototype.createApi = function(id, getRemoteUI) {
    var subscribers = [];
    var endpoint = this;

    if (endpoint.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error('[rempl][ws-transport] Publisher `' + id + '` is already registered on page');
        }

        return;
    }

    endpoint.publishers.push(id);
    endpoint.publishersMap[id] = {
        getRemoteUI: getRemoteUI,
        subscribers: subscribers
    };

    endpoint.sendInfo();

    return {
        connected: endpoint.connected,
        send: function() {
            endpoint.transport.emit.apply(endpoint.transport,
                ['rempl:from publisher', id].concat(Array.prototype.slice.call(arguments))
            );
        },
        subscribe: function(fn) {
            subscribers.push(fn);
        }
    };
};

module.exports = WSTransport;
