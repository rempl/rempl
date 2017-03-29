/* eslint-env browser */

var Transport = require('./transport-ws.js');
var identify = require('./identify.js').wrapTransport;
var meta = document.querySelector && document.querySelector('meta[name="rempl:server"]');
var endpoint = (meta && meta.getAttribute('value')) || ('ws://' + (location.hostname || 'localhost') + ':8177');
var transport;

module.exports = function(publisher, callback) {
    if (!transport) {
        transport = identify(new Transport(endpoint));
    }

    callback(transport.createApi(
        publisher.id,
        publisher.getRemoteUI
    ));
};
