var Value = require('../../utils/Value.js');
var pluginSync = require('./sync-devtools.js');
var serverSync = require('./sync-server.js');
var noop = function(){};

module.exports = function createSync(observer) {
    function processCommand(command, callback){
        if (!observer.ns(command.ns).hasOwnProperty(command.method)) {
            return console.warn('[rempl][sync] Unknown remote command:', command);
        }

        observer.ns(command.ns)[command.method].apply(null, command.args.concat(callback));
    }

    var remoteInspectors = new Value(0);
    var devtools = new Value(false);
    var send = {
        remote: noop,
        devtools: noop
    };

    // init ws-server
    serverSync.onInit(function(remoteApi){
        // sync features list
        observer.features.link(remoteApi, remoteApi.setFeatures);

        // subscribe to data from remote devtools & context free send method
        remoteApi.subscribe(processCommand);
        remoteApi.connected.attach(function(connected){
            remoteInspectors.set(connected);
            send.remote = connected ? remoteApi.send : noop;
        });
    });

    // init devtools
    pluginSync.onInit(function(pluginApi){
        // sync features list
        observer.features.link(pluginApi, pluginApi.setFeatures);

        // subscribe to data from devtools & context free send method
        pluginApi.subscribe(processCommand);
        pluginApi.connected.attach(function(connected){
            devtools.set(connected);
            send.devtools = connected ? pluginApi.send : noop;
        });
    });

    observer.remoteInspectors = remoteInspectors; // TODO: remove
    observer.devtools = devtools;                 // TODO: remove
    observer.send = function(){
        send.devtools.apply(null, arguments);
        send.remote.apply(null, arguments);
    };
}
