/* eslint-env browser */

var WsTransport = require('../../transport/ws-publisher.js');
var identify = require('./identify.js');
var STORAGE_KEY = 'rempl:id';
var sessionStorage = global.sessionStorage || {};
var meta = document.querySelector && document.querySelector('meta[name="rempl:server"]');
var metaValue = meta && meta.getAttribute('value');
var defaultUri = metaValue
    ? (metaValue.toLowerCase() !== 'none' ? metaValue : false)
    : ('ws://' + (location.hostname || 'localhost') + ':8177');

function BrowserWsTransport(uri) {
    WsTransport.call(this, uri);

    this.id = sessionStorage[STORAGE_KEY];
    this.transport
        .on('rempl:identify', identify.start)
        .on('rempl:stop identify', identify.stop)
        .on('disconnect', identify.stop);
}

BrowserWsTransport.defaultUri = defaultUri;
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
