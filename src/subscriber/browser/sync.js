module.exports = function createSync(subscriber) {
    var syncSandbox = require('./sync-sandbox.js');

    syncSandbox(subscriber, function(api) {
        api.subscribe(subscriber.processInput);
        api.connected.link(function(connected) {
            subscriber.setupChannel('sandbox', api.send, connected);
        });
    });

    return subscriber;
};
