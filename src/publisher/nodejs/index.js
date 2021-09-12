var WsTransport = require("./transport-ws.js");
var attachWsTransport = require("../ws.js");
var createFactory = require("../factory.js");
var addGetRemoteUI = require("../getRemoteUI.js");

module.exports = createFactory(function setupPublisher(
    publisher,
    getRemoteUI,
    options
) {
    addGetRemoteUI(publisher, getRemoteUI);
    attachWsTransport(publisher, WsTransport, options);
});
