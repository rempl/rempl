/* eslint-env browser */

var WsTransport = require('../../transport/ws.js');
var global = new Function('return this')();
var sessionStorage = global.sessionStorage || {};
var STORAGE_KEY = 'rempl:clientId';

function BrowserWsTransport() {
    this.title = global.top.document.title;
    this.location = String(location);

    WsTransport.apply(this, arguments);

    this.clientId = sessionStorage[STORAGE_KEY];
}

BrowserWsTransport.create = WsTransport.create;
BrowserWsTransport.prototype = Object.create(WsTransport.prototype);

BrowserWsTransport.prototype.setClientId = function(clientId) {
    WsTransport.prototype.setClientId.call(this, clientId);
    sessionStorage[STORAGE_KEY] = this.clientId;
};

BrowserWsTransport.prototype.type = 'browser';
BrowserWsTransport.prototype.clientInfoFields = WsTransport.prototype.clientInfoFields.concat(
    'title',
    'location'
);

BrowserWsTransport.prototype.getInfo = function() {
    this.title = global.top.document.title;
    this.location = String(location);
    return WsTransport.prototype.getInfo.call(this);
};

module.exports = BrowserWsTransport;
