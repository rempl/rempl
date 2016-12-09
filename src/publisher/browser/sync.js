// var Token = require('../../utils/index.js').Token;
var utils = require('../../utils/index.js');
var pluginSync = require('./sync-browser-extension.js');
// var inpageSync = require('./sync-in-page.js');
var serverSync = require('./sync-server.js');
var noop = function() {};

module.exports = function createSync(publisher) {
    // var remoteSubscribers = new Token(0);
    // var devtools = new Token(false);

    // browser extension
    pluginSync(publisher, function(api) {
        // sync features list
        // publisher.features.link(api, api.setFeatures);

        // subscribe to data from devtools & context free send method
        api.subscribe(publisher.processInput);
        utils.link(api.connected, function(connected) {
            // devtools.set(connected);
            publisher.channels.browserExtension = connected ? api.send : noop;
        });

        console.log('browser extension ready');
    });

    // in page
    // inpageSync(publisher, function(api) {
    //     // sync features list
    //     // publisher.features.link(api, api.setFeatures);

    //     // subscribe to data from devtools & context free send method
    //     api.subscribe(publisher.processInput);
    //     utils.link(api.connected, function(connected) {
    //         // devtools.set(connected);
    //         publisher.channels.inPage = connected ? api.send : noop;
    //     });

    //     console.log('in-page ready');
    // });

    // ws server
    serverSync(publisher, function(api) {
        // sync features list
        // publisher.features.link(api, api.setFeatures);

        // subscribe to data from remote devtools & context free send method
        api.subscribe(publisher.processInput);
        utils.link(api.connected, function(connected) {
            // remoteSubscribers.set(connected);
            publisher.channels.wsserver = connected ? api.send : noop;
        });

        console.log('ws server connection ready');
    });

    // publisher.remoteSubscribers = remoteSubscribers;   // TODO: remove
    // publisher.devtools = devtools;                 // TODO: remove

    return publisher;
};
