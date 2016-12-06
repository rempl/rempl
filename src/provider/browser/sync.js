// var Token = require('../../utils/index.js').Token;
var utils = require('../../utils/index.js');
var pluginSync = require('./sync-browser-extension.js');
// var inpageSync = require('./sync-in-page.js');
var serverSync = require('./sync-server.js');
var noop = function() {};

module.exports = function createSync(provider) {
    // var remoteCustomers = new Token(0);
    // var devtools = new Token(false);

    // browser extension
    pluginSync(provider, function(api) {
        // sync features list
        // provider.features.link(api, api.setFeatures);

        // subscribe to data from devtools & context free send method
        api.subscribe(provider.processInput);
        utils.link(api.connected, function(connected) {
            // devtools.set(connected);
            provider.channels.browserExtension = connected ? api.send : noop;
        });

        console.log('browser extension ready');
    });

    // in page
    // inpageSync(provider, function(api) {
    //     // sync features list
    //     // provider.features.link(api, api.setFeatures);

    //     // subscribe to data from devtools & context free send method
    //     api.subscribe(provider.processInput);
    //     utils.link(api.connected, function(connected) {
    //         // devtools.set(connected);
    //         provider.channels.inPage = connected ? api.send : noop;
    //     });

    //     console.log('in-page ready');
    // });

    // ws server
    serverSync(provider, function(api) {
        // sync features list
        // provider.features.link(api, api.setFeatures);

        // subscribe to data from remote devtools & context free send method
        api.subscribe(provider.processInput);
        utils.link(api.connected, function(connected) {
            // remoteCustomers.set(connected);
            provider.channels.wsserver = connected ? api.send : noop;
        });

        console.log('ws server connection ready');
    });

    // provider.remoteCustomers = remoteCustomers;   // TODO: remove
    // provider.devtools = devtools;                 // TODO: remove

    return provider;
};
