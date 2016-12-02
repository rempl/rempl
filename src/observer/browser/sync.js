// var Value = require('../../utils/Value.js');
var pluginSync = require('./sync-devtools.js');
var serverSync = require('./sync-server.js');
var noop = function() {};

module.exports = function createSync(observer) {
    // var remoteInspectors = new Value(0);
    // var devtools = new Value(false);

    // init ws-server
    serverSync(observer, function(remoteApi) {
        // sync features list
        // observer.features.link(remoteApi, remoteApi.setFeatures);

        // subscribe to data from remote devtools & context free send method
        remoteApi.subscribe(observer.processInput);
        remoteApi.connected.attach(function(connected) {
            // remoteInspectors.set(connected);
            observer.channels.wsserver = connected ? remoteApi.send : noop;
        });

        console.log('ws transport ready');
    });

    // init devtools
    pluginSync(observer, function(pluginApi) {
        // sync features list
        // observer.features.link(pluginApi, pluginApi.setFeatures);

        // subscribe to data from devtools & context free send method
        pluginApi.subscribe(observer.processInput);
        pluginApi.connected.attach(function(connected) {
            // devtools.set(connected);
            observer.channels.devtools = connected ? pluginApi.send : noop;
        });

        console.log('dom event transport ready');
    });

    // observer.remoteInspectors = remoteInspectors; // TODO: remove
    // observer.devtools = devtools;                 // TODO: remove

    return observer;
};
