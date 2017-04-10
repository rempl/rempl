var EventTransport = require('../../transport/event.js');
var WsTransport = require('./transport-ws.js');
var attachWsTransport = require('../ws.js');
var createFactory = require('../factory.js');
var addGetRemoteUI = require('../getRemoteUI.js');
var updatePublisherList = require('./identify.js').updatePublisherList;

module.exports = createFactory(function setupPublisher(publisher, getRemoteUI, options) {
    addGetRemoteUI(publisher, getRemoteUI);

    // browser extension
    EventTransport
        .get('rempl-browser-extension-publisher', 'rempl-browser-extension-host')
        .sync(publisher);

    // in page
    EventTransport
        .get('rempl-inpage-publisher', 'rempl-inpage-host')
        .sync(publisher);

    attachWsTransport(publisher, WsTransport, options);
}, updatePublisherList);
