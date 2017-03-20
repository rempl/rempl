module.exports = function createSync(publisher) {
    var syncBrowserExtension = require('./sync-browser-extension.js');
    // var inpageSync = require('./sync-in-page.js');
    var syncWs = require('./sync-ws.js');

    // browser extension
    syncBrowserExtension(publisher, function(api) {
        api.subscribe(publisher.processInput);
        api.connected.link(function(connected) {
            publisher.setupChannel('browserExtension', api.send, connected);
        });
    });

    // // in page
    // inpageSync(publisher, function(api) {
    //     api.subscribe(publisher.processInput);
    //     api.connected.link(function(connected) {
    //         // devtools.set(connected);
    //         publisher.channels.inPage = connected ? api.send : null;
    //     });
    // });

    // ws server
    syncWs(publisher, function(api) {
        api.subscribe(publisher.processInput);
        api.connected.link(function(connected) {
            publisher.setupChannel('ws', api.send, connected);
        });
    });

    return publisher;
};
