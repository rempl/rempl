var Token = require('../classes/Token');
var EventTransport = require('../transport/event.js');

module.exports = function createProxy(name, connectTo, win, remoteName) {
    var subscribers = [];
    var proxyApi = {
        send: function() {},
        subscribe: function(fn) {
            if (subscribers.indexOf(fn) === -1) {
                subscribers.push(fn);
            }
        },
        connected: new Token(false)
    };

    new EventTransport(name, connectTo, {
        name: remoteName,
        env: win
    }).onInit({ id: remoteName }, function(api) {
        proxyApi.send = function() {
            api.send.apply(api, arguments);
        };
        proxyApi.subscribe = api.subscribe;
        api.connected.link(function(value) {
            proxyApi.connected.set(value);
        });

        subscribers.forEach(api.subscribe);
        subscribers = null;
    });

    return proxyApi;
};
