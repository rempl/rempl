var Transport = require('./transport-ws.js');
var endpoint = process.env.REMPL_SERVER || 'ws://localhost:8177';
var transport;

module.exports = function(publisher, callback) {
    if (!transport) {
        transport = new Transport(publisher.wsendpoint || endpoint);
    }

    callback(transport.createApi(
        publisher.id,
        publisher.getRemoteUI
    ));
};
