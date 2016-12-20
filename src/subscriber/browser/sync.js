var utils = require('../../utils/index.js');

module.exports = function createSync(subscriber) {
    var syncSandbox = require('./sync-sandbox.js');

    syncSandbox(subscriber, function(api) {
        api.subscribe(subscriber.processInput);
        utils.link(api.connected, function(connected) {
            subscriber.channels.sandbox = connected ? api.send : null;

            // TODO: make it better
            if (connected) {
                for (var name in subscriber.namespaces) {
                    var ns = subscriber.namespaces[name];
                    if (ns.subscribers.length) {
                        ns.invoke('init', function(data) {
                            ns.subscribers.forEach(function(subscriber) {
                                subscriber(data);
                            });
                        });
                    }
                }
            }
        });
    });

    return subscriber;
};
