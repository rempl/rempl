var Client = require('./client');
var noop = function() {};

module.exports = function createSync(observer, endpoint) {
    function invoke(packet, callback) {
        var ns = packet.ns || '*';
        console.log(packet);

        if (!observer.ns(ns).has(packet.method)) {
            return console.warn('[rempl][sync] Unknown remote command:', packet);
        }

        observer.ns(ns).invoke(packet.method, packet.args, callback);
    }

    observer.client = Client.create(endpoint);

    var remoteApi = observer.client.createApi(observer.id, observer.getRemoteUI);
    remoteApi.subscribe(invoke);
    remoteApi.connected.attach(function(connected) {
        observer.channels.wsserver = connected ? remoteApi.send : noop;
    });

    return observer;
};
