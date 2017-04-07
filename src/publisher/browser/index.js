var EventTransport = require('../../transport/event.js');
var WSTransport = require('./transport-ws.js');
var createFactory = require('../factory.js');
var addGetRemoteUI = require('../getRemoteUI.js');
var updatePublisherList = require('./identify.js').updatePublisherList;

module.exports = createFactory(function setupPublisher(publisher, getRemoteUI) {
    addGetRemoteUI(publisher, getRemoteUI);

    // browser extension
    EventTransport
        .get('rempl-browser-extension-publisher', 'rempl-browser-extension-host')
        .sync(publisher);

    // in page
    EventTransport
        .get('rempl-inpage-publisher', 'rempl-inpage-host')
        .sync(publisher);

    // ws server
    WSTransport
        .get(publisher.wsendpoint)
        .sync(publisher);
}, updatePublisherList);
