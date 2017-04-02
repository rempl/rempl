var Token = require('../classes/Token.js');
var utils = require('../utils');
var socketIO = require('socket.io-client');
var endpoints = Object.create(null);
var INFO_UPDATE_TIME = 100;
var DEBUG = false;
var DEBUG_PREFIX = '[rempl][ws-transport] ';

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

function subscribe(endpoint, fn) {
    return utils.subscribe(this.dataCallbacks, {
        endpoint: endpoint,
        fn: fn
    });
}

function send(endpoint) {
    this.transport.emit.apply(this.transport,
        ['rempl:from publisher', endpoint].concat(Array.prototype.slice.call(arguments, 1))
    );
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
        console.log(DEBUG_PREFIX + 'connected');
    }
}

function onGetUI(id, settings, callback) {
    if (!this.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error(DEBUG_PREFIX + 'Publisher `' + id + '` isn\'t registered');
        }

        callback('Publisher `' + id + '` isn\'t registered');
        return;
    }

    this.publishersMap[id].getRemoteUI.call(null, settings || {}, callback);
}

function onData(id) {
    if (!this.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error(DEBUG_PREFIX + 'Publisher `' + id + '` isn\'t registered');
        }

        return;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    this.dataCallbacks.forEach(function(callback) {
        if (callback.endpoint === id) {
            callback.fn.apply(null, args);
        }
    });
}

function onDisconnect() {
    if (DEBUG) {
        console.log(DEBUG_PREFIX + 'disconnected');
    }

    clearInterval(this.sendInfoTimer);
    this.connected.set(false);
}

function WSTransport(uri) {
    this.sessionId = utils.genUID();
    this.id = null;

    this.sendInfoTimer = null;
    this.info = {};

    this.publishers = [];
    this.publishersMap = {};
    this.dataCallbacks = [];

    this.connected = new Token(false);

    if (DEBUG) {
        console.log(DEBUG_PREFIX + 'connecting to ' + normalizeUri(uri));
    }

    this.transport = socketIO.connect(normalizeUri(uri))
        .on('connect', onConnect.bind(this))
        .on('disconnect', onDisconnect.bind(this))
        .on('rempl:get ui', onGetUI.bind(this))
        .on('rempl:to publisher', onData.bind(this));
}

WSTransport.create = function(endpoint) {
    if (endpoint in endpoints) {
        return endpoints[endpoint];
    }

    return endpoints[endpoint] = new this(endpoint);
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

WSTransport.prototype.createApi = function(id, getRemoteUI) {
    if (this.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error(DEBUG_PREFIX + 'Publisher `' + id + '` is already registered');
        }

        return;
    }

    this.publishers.push(id);
    this.publishersMap[id] = {
        getRemoteUI: getRemoteUI
    };

    this.sendInfo();

    return {
        connected: this.connected,
        send: send.bind(this, id),
        subscribe: subscribe.bind(this, id)
    };
};

WSTransport.prototype.sync = function(endpoint) {
    var api = this.createApi(endpoint.id, endpoint.getRemoteUI);
    api.subscribe(endpoint.processInput);
    api.connected.link(function(connected) {
        endpoint.setupChannel('ws', api.send, connected);
    });
};

module.exports = WSTransport;
