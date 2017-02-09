/* eslint-env browser */

var WsTransport = require('../../transport/ws.js');
var global = new Function('return this')();
var sessionStorage = global.sessionStorage || {};
var STORAGE_KEY = 'rempl:id';

function BrowserWsTransport() {
    this.title = global.top.document.title;
    this.location = String(location);

    WsTransport.apply(this, arguments);

    this.id = sessionStorage[STORAGE_KEY];
}

BrowserWsTransport.create = WsTransport.create;
BrowserWsTransport.prototype = Object.create(WsTransport.prototype);

BrowserWsTransport.prototype.setClientId = function(id) {
    WsTransport.prototype.setClientId.call(this, id);
    sessionStorage[STORAGE_KEY] = this.id;
};

BrowserWsTransport.prototype.type = 'browser';
BrowserWsTransport.prototype.infoFields = WsTransport.prototype.infoFields.concat(
    'title',
    'location'
);

BrowserWsTransport.prototype.getInfo = function() {
    this.title = global.top.document.title;
    this.location = String(location);
    return WsTransport.prototype.getInfo.call(this);
};

module.exports = BrowserWsTransport;
