var Transport = require('./transport-ws.js');
var endpoint = process.env.REMPL_SERVER || 'ws://localhost:8177';
var api;

module.exports = function(publisher, callback) {
    if (!api) {
        api = new Transport(publisher.wsendpoint || endpoint).createApi(
            publisher.id,
            publisher.getRemoteUI
        );
    }

    callback(api);
};
