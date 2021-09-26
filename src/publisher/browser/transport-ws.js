/* eslint-env browser */
/* global REMPL_SERVER */

var WsTransport = require('../../transport/ws-publisher.js');
var identify = require('./identify.js');
var STORAGE_KEY = 'rempl:id';
var sessionStorage = global.sessionStorage || {};

function fetchWsSettings() {
    function fetchEnvVariable() {
        if (typeof REMPL_SERVER !== 'undefined' && REMPL_SERVER !== global.REMPL_SERVER) {
            return REMPL_SERVER;
        }
    }

    function fetchMeta() {
        var meta = document.querySelector && document.querySelector('meta[name="rempl:server"]');

        return (meta && meta.getAttribute('content')) || undefined;
    }

    var setup = fetchEnvVariable();
    var implicitUri = location.protocol + '//' + (location.hostname || 'localhost') + ':8177';
    var explicitUri = undefined;

    if (setup === undefined) {
        setup = fetchMeta();
    }

    switch (setup) {
        case 'none':
        case undefined:
        case false:
            // no explicit setting
            break;

        case 'implicit':
        case 'auto':
        case true:
            explicitUri = implicitUri;
            break;

        default:
            if (typeof setup === 'string') {
                explicitUri = setup;
            }
    }

    return {
        explicit: explicitUri,
        implicit: implicitUri,
    };
}

function BrowserWsTransport(uri) {
    WsTransport.call(this, uri);

    this.id = sessionStorage[STORAGE_KEY];
    this.transport
        .on('rempl:identify', identify.start)
        .on('rempl:stop identify', identify.stop)
        .on('disconnect', identify.stop);
}

BrowserWsTransport.settings = fetchWsSettings();
BrowserWsTransport.get = WsTransport.get;
BrowserWsTransport.prototype = Object.create(WsTransport.prototype);

BrowserWsTransport.prototype.setClientId = function (id) {
    WsTransport.prototype.setClientId.call(this, id);
    sessionStorage[STORAGE_KEY] = this.id;
};

BrowserWsTransport.prototype.type = 'browser';
BrowserWsTransport.prototype.infoFields = WsTransport.prototype.infoFields.concat(
    'title',
    'location'
);
BrowserWsTransport.prototype.getInfo = function () {
    this.title = global.top.document.title;
    this.location = String(location);
    return WsTransport.prototype.getInfo.call(this);
};

module.exports = BrowserWsTransport;
