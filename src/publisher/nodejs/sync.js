var utils = require('../../utils/index.js');

module.exports = function createSync(publisher) {
    var syncWs = require('./sync-ws.js');

    syncWs(publisher, function(api) {
        api.subscribe(publisher.processInput);
        utils.link(api.connected, function(connected) {
            publisher.channels.ws = connected ? api.send : null;
        });
    });

    return publisher;
};
