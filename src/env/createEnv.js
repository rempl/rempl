var Token = require('../classes/Token');
var EventTransport = require('../transport/event.js');
var utils = require('../utils/index.js');

module.exports = function createProxy(name, connectTo, win, remoteName) {
    var envApi;
    var subscribers = [];
    var unsubscribe = new WeakMap();
    var proxyApi = {
        connected: new Token(false),
        send: function() {
            if (envApi) {
                envApi.send.apply(envApi, arguments);
            }
        },
        subscribe: function(fn) {
            if (envApi) {
                return envApi.subscribe(fn);
            } else if (subscribers.indexOf(fn) == -1) {
                unsubscribe.set(fn, utils.subscribe(subscribers, fn));

                return function() {
                    unsubscribe.get(fn)();
                };
            }
        }
    };

    new EventTransport(name, connectTo, {
        name: remoteName,
        env: win
    }).onInit({ id: remoteName }, function(api) {
        envApi = api;
        api.connected.link(function(value) {
            proxyApi.connected.set(value);
        });

        subscribers.splice(0).forEach(function(fn) {
            unsubscribe.set(fn, api.subscribe(fn));
        });
    });

    return proxyApi;
};
