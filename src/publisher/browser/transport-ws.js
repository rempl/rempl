/* eslint-env browser */

var WsTransport = require('../../transport/ws-publisher.js');
var identify = require('./identify.js');
var global = new Function('return this')();
var meta = document.querySelector && document.querySelector('meta[name="rempl:server"]');
var REMPL_SERVER = (meta && meta.getAttribute('value')) || ('ws://' + (location.hostname || 'localhost') + ':8177');
var STORAGE_KEY = 'rempl:id';
var sessionStorage = global.sessionStorage || {};

function BrowserWsTransport(uri) {
    WsTransport.call(this, uri || REMPL_SERVER);

    this.id = sessionStorage[STORAGE_KEY];
    this.transport
        .on('rempl:identify', identify.start)
        .on('rempl:stop identify', identify.stop)
        .on('disconnect', identify.stop);
}

BrowserWsTransport.get = WsTransport.get;
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
