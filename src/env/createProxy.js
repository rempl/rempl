var Token = require('../classes/Token');
var EventTransport = require('../transport/event.js');

module.exports = function createProxy(name, connectTo, win, remoteName) {
    var envApi;
    var subscribers = [];
    var proxyApi = {
        send: function() {
            if (envApi) {
                envApi.send.apply(envApi, arguments);
            }
        },
        subscribe: function(fn) {
            if (envApi) {
                envApi.subscribe(fn);
            } else if (subscribers.indexOf(fn) == -1) {
                subscribers.push(fn);
            }
        },
        connected: new Token(false)
    };

    new EventTransport(name, connectTo, {
        name: remoteName,
        env: win
    }).onInit({ id: remoteName }, function(api) {
        envApi = api;
        api.connected.link(function(value) {
            proxyApi.connected.set(value);
        });

        if (subscribers.length) {
            subscribers.splice(0).forEach(api.subscribe);
        }
    });

    return proxyApi;
};
