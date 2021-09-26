/* eslint-env browser */
var EventTransport = require('../../transport/event.js');
var utils = require('../../utils/index.js');
var initEnvSubscriberMessage = new WeakMap();

if (parent !== self) {
    addEventListener('message', function (event) {
        var data = event.data || {};
        if (data.to === 'rempl-env-publisher:connect') {
            initEnvSubscriberMessage.set(event.source, data);
        }
    });
}

module.exports = function createSandbox(settings, callback) {
    function initSandbox(sandboxWindow) {
        if (settings.type === 'script') {
            for (var name in settings.content) {
                sandboxWindow.eval(settings.content[name] + '\n//# sourceURL=' + name);
            }
        }

        if (parent !== self && sandboxWindow !== self) {
            var toSandbox = NaN;
            var toEnv = NaN;

            if (onEnvMessage) {
                removeEventListener('message', onEnvMessage, true);
            }

            addEventListener(
                'message',
                (onEnvMessage = function (event) {
                    var data = event.data || {};

                    switch (data.to) {
                        case 'rempl-env-subscriber:connect':
                        case toSandbox:
                            toEnv = data.from;
                            sandboxWindow.postMessage(data, '*');
                            break;

                        case 'rempl-env-publisher:connect':
                        case toEnv:
                            toSandbox = data.from;
                            parent.postMessage(data, '*');
                            break;
                    }
                }),
                true
            );

            if (settings.type !== 'script') {
                var initMessage = initEnvSubscriberMessage.get(sandboxWindow);
                if (initMessage) {
                    toSandbox = initMessage.from;
                    parent.postMessage(initMessage, '*');
                }
            }
        }

        // sandbox <-> subscriber transport
        // TODO: teardown transport
        transport = EventTransport.get('rempl-sandbox', 'rempl-subscriber', sandboxWindow).onInit(
            {},
            function (api) {
                callback(api);
            }
        );

        if (connected) {
            transport.ownEndpoints.set(['*']);
        }
    }

    var envUnsubscribe = null;
    var iframe = null;
    var onEnvMessage = null;
    var transport = null;
    var connected = false;

    settings = settings || {};

    if (settings.window) {
        initSandbox(settings.window);
    } else {
        iframe = document.createElement('iframe');
        iframe.name = utils.genUID(); // to avoid cache
        iframe.onload = function () {
            initSandbox(iframe.contentWindow);
        };

        if (settings.type === 'url') {
            iframe.src = settings.content;
        } else {
            iframe.srcdoc = '<!doctype html>';
        }

        (settings.container || document.documentElement).appendChild(iframe);
    }

    return {
        setConnected: function (state) {
            connected = Boolean(state);
            if (transport) {
                transport.ownEndpoints.set(connected ? ['*'] : []);
            }
        },
        destroy: function () {
            removeEventListener('message', onEnvMessage, true);

            if (transport) {
                transport.ownEndpoints.set([]);
            }

            if (envUnsubscribe !== null) {
                envUnsubscribe();
                envUnsubscribe = null;
            }

            if (iframe !== null) {
                iframe.parentNode.removeChild(iframe);
                iframe.setAttribute('srcdoc', '');
                iframe.setAttribute('src', '');
                iframe = null;
            }
        },
    };
};
