// var Token = require('../../utils/index.js').Token;
var utils = require('../../utils/index.js');
var pluginSync = require('./sync-browser-extension.js');
// var inpageSync = require('./sync-in-page.js');
var serverSync = require('./sync-server.js');
var noop = function() {};

module.exports = function createSync(observer) {
    // var remoteCustomers = new Token(0);
    // var devtools = new Token(false);

    // browser extension
    pluginSync(observer, function(api) {
        // sync features list
        // observer.features.link(api, api.setFeatures);

        // subscribe to data from devtools & context free send method
        api.subscribe(observer.processInput);
        utils.link(api.connected, function(connected) {
            // devtools.set(connected);
            observer.channels.browserExtension = connected ? api.send : noop;
        });

        console.log('browser extension ready');
    });

    // in page
    // inpageSync(observer, function(api) {
    //     // sync features list
    //     // observer.features.link(api, api.setFeatures);

    //     // subscribe to data from devtools & context free send method
    //     api.subscribe(observer.processInput);
    //     utils.link(api.connected, function(connected) {
    //         // devtools.set(connected);
    //         observer.channels.inPage = connected ? api.send : noop;
    //     });

    //     console.log('in-page ready');
    // });

    // ws server
    serverSync(observer, function(api) {
        // sync features list
        // observer.features.link(api, api.setFeatures);

        // subscribe to data from remote devtools & context free send method
        api.subscribe(observer.processInput);
        utils.link(api.connected, function(connected) {
            // remoteCustomers.set(connected);
            observer.channels.wsserver = connected ? api.send : noop;
        });

        console.log('ws server connection ready');
    });

    // observer.remoteCustomers = remoteCustomers;   // TODO: remove
    // observer.devtools = devtools;                 // TODO: remove

    return observer;
};
