/* eslint-env browser */

var Transport = require('./transport-ws.js');
var identify = require('./identify.js');
var meta = document.querySelector && document.querySelector('meta[name="rempl:server"]');
var endpoint = (meta && meta.getAttribute('value')) || ('ws://' + (location.hostname || 'localhost') + ':8177');
var transport;

module.exports = function(publisher, callback) {
    if (!transport) {
        transport = new Transport(endpoint);
        transport.startIdentify = identify.start;
        transport.stopIdentify = identify.stop;
    }

    callback(transport.createApi(publisher.id, publisher.getRemoteUI));
};
