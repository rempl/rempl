var fs = require('fs');
var path = require('path');
var EventEmitter = require('events');
var Token = require('../../utils/Token');
var utils = require('../../utils');
var socketIO = require('socket.io-client');

var CLIENT_ID_FILENAME = '.rempl_client_id';

/**
 * node.js remote client
 *
 * @param {string} uri
 * @param {string} name
 * @constructor
 * @extends {EventEmitter}
 */
function Client(uri, name) {
    this.url = uri;
    this.name = name || 'Unnamed node.js process';
    this.sessionId = utils.genUID();
    this.clientId = null;

    // TODO make it through temp file
    if (fs.existsSync(path.resolve(CLIENT_ID_FILENAME))) {
        this.clientId = fs.readFileSync(path.resolve(CLIENT_ID_FILENAME), { encoding: 'utf-8' });
    }

    this.clientInfo = {};

    this.sendInfoTimer = null;
    this.sendInfoTimerTTL = 150;

    this.isOnline = new Token(false);
    this.features = new Token([]);

    this.transport = socketIO.connect(uri);
    this.transport
        .on('connect', function() {
            console.log('Connected');
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
        .on('devtool:get ui', this.getUI.bind(this))
        .on('features', function(features) {
            this.features.set(features);
        }.bind(this))
        .on('devtool:identify', this.startIdentify.bind(this))
        .on('devtool:stop identify', this.stopIdentify.bind(this))
        .on('disconnect', function() {
            console.log('Disconnected');
            this.isOnline.set(false);
            this.features.set([]);

            clearInterval(this.sendInfoTimer);
            this.stopIdentify();
        }.bind(this));
}

Client.prototype = Object.create(EventEmitter.prototype);

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
        features: this.features
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
        String(this.clientInfo.features) != String(newClientInfo.features)
    ) {
        this.clientInfo = newClientInfo;
        this.send('devtool:client info', this.clientInfo);
    }
};

/**
 * Get UI for this client
 */
Client.prototype.getUI = function(config, callback) {
    console.log('Send UI');
    callback(null, 'script', 'console.log(new Date())');
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
    console.error('#startIdentify not implemented');
    callback();
};

Client.prototype.stopIdentify = function() {
    console.error('#stopIdentify not implemented');
};

module.exports = Client;
