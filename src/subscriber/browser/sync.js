module.exports = function createSync(subscriber) {
    var syncSandbox = require('./sync-sandbox.js');

    syncSandbox(subscriber, function(api) {
        api.subscribe(subscriber.processInput);
        api.connected.link(function(connected) {
            subscriber.channels.sandbox = connected ? api.send : null;

            // TODO: make it better
            if (connected) {
                subscriber.requestRemoteApi();
                for (var name in subscriber.namespaces) {
                    var ns = subscriber.namespaces[name];
                    if (ns.subscribers.length) {
                        ns.callRemote('init', function(data) {
                            this.subscribers.forEach(function(subscriber) {
                                subscriber(data);
                            });
                        }.bind(ns));
                    }
                }
            }
        });
    });

    return subscriber;
};
