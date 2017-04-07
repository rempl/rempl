var WSTransport = require('./transport-ws.js');
var createFactory = require('../factory.js');
var addGetRemoteUI = require('../getRemoteUI.js');

function attachWsTransport(publisher) {
    // ws server
    WSTransport
        .get(publisher.wsendpoint)
        .sync(publisher);
}

module.exports = createFactory(function setupPublisher(publisher, getRemoteUI, options) {
    addGetRemoteUI(publisher, getRemoteUI);

    if (options && options.manualSync) {
        publisher.sync = function() {
            attachWsTransport(publisher);
        };
    } else {
        attachWsTransport(publisher);
    }
});
