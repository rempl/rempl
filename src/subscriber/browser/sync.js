var setOverlayVisible = require('./disconnected-overlay.js');

module.exports = function createSync(subscriber) {
    var syncSandbox = require('./sync-sandbox.js');

    syncSandbox(subscriber, function(api) {
        api.subscribe(subscriber.processInput);
        api.connected.link(function(connected) {
            subscriber.setupChannel('sandbox', api.send, connected);
        });

        subscriber.connected.link(function(connected) {
            setOverlayVisible(connected);

            // TODO: make it better
            if (connected) {
                subscriber.requestRemoteApi();
                for (var name in subscriber.namespaces) {
                    var ns = subscriber.namespaces[name];
                    if (ns.subscribers.length) {
                        ns.callRemote('init', function(data) {
                            this.subscribers.forEach(function(callback) {
                                callback(data);
                            });
                        }.bind(ns));
                    }
                }
            } else {
                subscriber.setRemoteApi();
            }
        });
    });

    return subscriber;
};
