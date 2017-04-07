/* eslint-env browser */
var EventTransport = require('../../transport/event.js');
var utils = require('../../utils/index.js');

module.exports = function createSandbox(settings, callback) {
    function initSandbox(sandboxWindow) {
        if (settings.type === 'script') {
            for (var name in settings.content) {
                sandboxWindow.eval(
                    settings.content[name] +
                    '\n//# sourceURL=' + name
                );
            }
        }

        if (parent !== self && sandboxWindow !== self) {
            var toSandbox = null;
            var toEnv = null;

            if (onEnvMessage) {
                removeEventListener('message', onEnvMessage, true);
            }
            addEventListener('message', onEnvMessage = function(event) {
                var data = event.data || {};

                switch (data.to) {
                    case 'rempl-env-subscriber:connect':
                        toEnv = data.from;
                        sandboxWindow.postMessage(data, '*');
                        break;

                    case toSandbox:
                        sandboxWindow.postMessage(data, '*');
                        if (data.payload && data.payload.type === 'connect') {
                            sandboxWindow.postMessage({
                                from: data.from,
                                to: data.to,
                                payload: {
                                    type: 'data',
                                    endpoint: 'editor',
                                    data: [{
                                        type: 'publisher:connect'
                                    }]
                                }
                            }, '*');
                        }
                        break;

                    case 'rempl-env-publisher:connect':
                        toSandbox = data.from;
                        parent.postMessage(data, '*');
                        break;

                    case toEnv:
                        parent.postMessage(data, '*');
                        break;
                }
            }, true);
        }

        // sandbox <-> subscriber transport
        // TODO: teardown transport
        new EventTransport('rempl-sandbox', 'rempl-subscriber', sandboxWindow)
        .onInit({}, function(api) {
            callback(api);
        });
    }

    var envUnsubscribe = null;
    var iframe = null;
    var onEnvMessage = null;

    settings = settings || {};

    if (settings.window) {
        initSandbox(settings.window);
    } else {
        iframe = document.createElement('iframe');
        iframe.name = utils.genUID(); // to avoid cache
        iframe.onload = function() {
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
        destroy: function() {
            removeEventListener('message', onEnvMessage, true);

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
        }
    };
};
