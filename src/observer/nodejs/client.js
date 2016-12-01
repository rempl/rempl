var fs = require('fs');
var path = require('path');
var Token = require('../../utils/Token');
var utils = require('../../utils');
var socketIO = require('socket.io-client');
var clients = Object.create(null);

var CLIENT_ID_FILENAME = '.rempl_client_id';

/**
 * node.js remote client
 *
 * @param {string} uri
 * @param {string} name
 * @constructor
 * @extends {EventEmitter}
 */
function Client(uri) {
    this.url = uri;
    this.name = process.title;
    this.sessionId = utils.genUID();
    this.clientId = null;

    // TODO make it through temp file
    if (fs.existsSync(path.resolve(CLIENT_ID_FILENAME))) {
        this.clientId = fs.readFileSync(path.resolve(CLIENT_ID_FILENAME), { encoding: 'utf-8' });
    }

    this.clientInfo = {};
    this.observers = [];
    this.observersMap = {};

    this.sendInfoTimer = null;
    this.sendInfoTimerTTL = 150;

    this.isOnline = new Token(false);
    this.features = [];

    this.transport = socketIO.connect(uri);
    this.transport
        .on('connect', function() {
            console.log('[rempl] connected');
            clearInterval(this.sendInfoTimer);

            this.isOnline.set(true);
            this.clientInfo = this.getInfo();

            this.send('devtool:client connect', this.clientInfo, function(data) {
                if ('clientId' in data) {
                    this.clientId = data.clientId;
                    fs.writeFileSync(CLIENT_ID_FILENAME, this.clientId);
                }

                this.sendInfoTimer = setInterval(this.sendInfo.bind(this), this.sendInfoTimerTTL);
            }.bind(this));
        }.bind(this))
        .on('features', function(features) {
            this.setFeatures(features);
        }.bind(this))

        .on('devtool:get ui', function(id, settings, callback) {
            if (!this.observersMap.hasOwnProperty(id)) {
                console.error('[rempl][ws-transport] Observer `' + id + '` isn\'t registered on page');
                callback('[rempl][ws-transport] Observer `' + id + '` isn\'t registered on page');
                return;
            }

            this.observersMap[id].getRemoteUI.call(null, settings, callback);
        }.bind(this))
        .on('devtool:to session', function(id) {
            if (!this.observersMap.hasOwnProperty(id)) {
                console.error('[rempl][ws-transport] Observer `' + id + '` isn\'t registered on page');
                return;
            }

            var subscribers = this.observersMap[id].subscribers;
            var args = Array.prototype.slice.call(arguments, 1);

            for (var i = 0; i < subscribers.length; i++) {
                subscribers[i].apply(null, args);
            }
        }.bind(this))

        .on('devtool:identify', this.startIdentify.bind(this))
        .on('devtool:stop identify', this.stopIdentify.bind(this))

        .on('disconnect', function() {
            console.log('[rempl] disconnected');
            this.isOnline.set(false);
            this.setFeatures([]);

            clearInterval(this.sendInfoTimer);
            this.stopIdentify();
        }.bind(this));
}

Client.create = function(endpoint) {
    if (endpoint in clients) {
        return clients[endpoint];
    }

    return clients[endpoint] = new Client(endpoint);
};

/**
 * Send data through WS
 */
Client.prototype.send = function() {
    this.transport.emit.apply(this.transport, arguments);
};

/**
 * Get self info
 * @returns Object
 */
Client.prototype.getInfo = function() {
    return {
        clientId: this.clientId,
        sessionId: this.sessionId,
        title: this.name,
        pid: process.pid,
        type: 'node',
        features: this.features.slice(),
        observers: this.observers.slice()
    };
};

/**
 * Send self info to server
 */
Client.prototype.sendInfo = function() {
    var newClientInfo = this.getInfo();

    if (
        this.clientInfo.title != newClientInfo.title ||
        this.clientInfo.pid != newClientInfo.pid ||
        String(this.clientInfo.features) != String(newClientInfo.features) ||
        String(this.clientInfo.observers) != String(newClientInfo.observers)
    ) {
        this.clientInfo = newClientInfo;
        this.send('devtool:client info', this.clientInfo);
    }
};

/**
 * Set features for this client
 *
 * @param {Array<string>} list
 */
Client.prototype.setFeatures = function(list) {
    this.features = Array.prototype.slice.call(list || []);
    this.sendInfo();
};

Client.prototype.startIdentify = function(num, callback) {
    console.error('[rempl] #startIdentify not implemented');
    callback();
};

Client.prototype.stopIdentify = function() {
    console.error('[rempl] #stopIdentify not implemented');
};

Client.prototype.createApi = function(id, getRemoteUI) {
    var subscribers = [];

    if (this.observersMap.hasOwnProperty(id)) {
        console.error('[rempl][ws-transport] Observer `' + id + '` already registered on page');
        return;
    }

    this.observers.push(id);
    this.observersMap[id] = {
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
            this.transport.emit.apply(this.transport, ['devtool:client data', id].concat(
                Array.prototype.slice.call(arguments)
            ));
        }.bind(this),
        subscribe: function(fn) {
            subscribers.push(fn);
        }
    };
};

module.exports = Client;
