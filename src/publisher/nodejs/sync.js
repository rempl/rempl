module.exports = function createSync(publisher) {
    var syncWs = require('./sync-ws.js');

    syncWs(publisher, function(api) {
        api.subscribe(publisher.processInput);
        api.connected.link(function(connected) {
            publisher.setupChannel('ws', api.send, connected);
        });
    });

    return publisher;
};
