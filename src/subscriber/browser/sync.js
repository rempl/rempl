var utils = require('../../utils/index.js');

module.exports = function createSync(subscriber) {
    var syncSandbox = require('./sync-sandbox.js');

    syncSandbox(subscriber, function(api) {
        api.subscribe(subscriber.processInput);
        utils.link(api.connected, function(connected) {
            subscriber.channels.browserExtension = connected ? api.send : null;
        });
    });

    return subscriber;
};
