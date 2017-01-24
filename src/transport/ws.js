var Token = require('../classes/Token.js');
var utils = require('../utils');
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

    if (DEBUG) {
        console.log('[rempl][ws-transport] connecting to ' + normalizeUri(uri));
    }

    this.transport = socketIO.connect(normalizeUri(uri))
        .on('connect', onConnect.bind(this))
        .on('disconnect', onDisconnect.bind(this))
        .on('features', this.setFeatures.bind(this))

        .on('rempl:get ui', onGetUI.bind(this))
        .on('rempl:to session', onData.bind(this))

        .on('rempl:identify', callMethod(this, 'startIdentify'))
        .on('rempl:stop identify', callMethod(this, 'stopIdentify'));
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
        debugger;
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
    var publisher = this;

    if (publisher.publishersMap.hasOwnProperty(id)) {
        if (DEBUG) {
            console.error('[rempl][ws-transport] Publisher `' + id + '` is already registered on page');
        }

        return;
    }

    publisher.publishers.push(id);
    publisher.publishersMap[id] = {
        getRemoteUI: getRemoteUI,
        subscribers: subscribers
    };

    publisher.sendInfo();

    return {
        connected: publisher.isOnline,
        setFeatures: function(list) {
            publisher.setFeatures(list);
        },
        send: function() {
            publisher.transport.emit.apply(publisher.transport,
                ['rempl:client data', id].concat(Array.prototype.slice.call(arguments))
            );
        },
        subscribe: function(fn) {
            subscribers.push(fn);
        }
    };
};

module.exports = WSTransport;
