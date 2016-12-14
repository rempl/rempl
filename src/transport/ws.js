var utils = require('../utils');
var Token = require('../utils/Token.js');
var socketIO = require('socket.io-client');
var clients = Object.create(null);
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

function onConnect() {
    clearInterval(this.sendInfoTimer);

    this.isOnline.set(true);
    this.clientInfo = this.getInfo();

    this.send('rempl:client connect', this.clientInfo, function(data) {
        if ('clientId' in data) {
            this.setClientId(data.clientId);
        }

        this.sendInfoTimer = setInterval(this.sendInfo.bind(this), this.sendInfoTimerTTL);
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

    this.publishersMap[id].getRemoteUI.call(null, settings, callback);
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

    this.isOnline.set(false);
    this.setFeatures([]);

    clearInterval(this.sendInfoTimer);
    this.stopIdentify();
}

function WSTransport(uri) {
    this.sessionId = utils.genUID();
    this.clientId = null;

    this.clientInfo = {};
    this.publishers = [];
    this.publishersMap = {};

    this.sendInfoTimer = null;
    this.sendInfoTimerTTL = 150;

    this.isOnline = new Token(false);
    this.features = [];

    this.transport = socketIO.connect(uri)
        .on('connect', onConnect.bind(this))
        .on('disconnect', onDisconnect.bind(this))
        .on('features', this.setFeatures.bind(this))

        .on('rempl:get ui', onGetUI.bind(this))
        .on('rempl:to session', onData.bind(this))

        .on('rempl:identify', this.startIdentify.bind(this))
        .on('rempl:stop identify', this.stopIdentify.bind(this));
}

WSTransport.create = function(endpoint) {
    if (endpoint in clients) {
        return clients[endpoint];
    }

    return clients[endpoint] = new WSTransport(endpoint);
};

WSTransport.prototype.type = 'unknown';
WSTransport.prototype.clientInfoFields = [
    'clientId',
    'sessionId',
    'type',
    'features',
    'publishers'
];

WSTransport.prototype.setClientId = function(clientId) {
    this.clientId = clientId;
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

    this.clientInfoFields.forEach(function(name) {
        result[name] = Array.isArray(this[name]) ? this[name].slice() : this[name];
    }, this);

    return result;
    return {
        clientId: this.clientId,
        sessionId: this.sessionId,
        title: this.name,
        pid: process.pid,
        type: 'node',
        features: this.features.slice(),
        publishers: this.publishers.slice()
    };
};

/**
 * Send self info to server
 */
WSTransport.prototype.sendInfo = function() {
    var newInfo = this.getInfo();

    if (valuesChanged(this.clientInfo, newInfo)) {
        this.clientInfo = newInfo;
        this.send('rempl:client info', this.clientInfo);
    }
};

/**
 * Set features for this client
 *
 * @param {Array<string>} list
 */
WSTransport.prototype.setFeatures = function(list) {
    this.features = Array.prototype.slice.call(list || []);
    this.sendInfo();
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

    if (this.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error('[rempl][ws-transport] Publisher `' + id + '` is already registered on page');
        }

        return;
    }

    this.publishers.push(id);
    this.publishersMap[id] = {
        getRemoteUI: getRemoteUI,
        subscribers: subscribers
    };

    this.sendInfo();

    return {
        connected: this.isOnline,
        setFeatures: function(list) {
            this.setFeatures(list);
        }.bind(this),
        send: function() {
            this.transport.emit.apply(this.transport, ['rempl:client data', id].concat(
                Array.prototype.slice.call(arguments)
            ));
        }.bind(this),
        subscribe: function(fn) {
            subscribers.push(fn);
        }
    };
};

module.exports = WSTransport;
