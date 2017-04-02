/* eslint-env browser */
var EventTransport = require('../../transport/event.js');
var utils = require('../../utils/index.js');
var getEnv = require('../../env/index.js');

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

        // sandbox <-> subscriber transport
        // TODO: teardown transport
        new EventTransport('rempl-sandbox', 'rempl-subscriber', sandboxWindow)
        .onInit({}, function(api) {
            var env = getEnv();

            if (env.enabled) {
                envUnsubscribe = env.subscribe(function(data) {
                    api.send({
                        type: 'env:data',
                        payload: data
                    });
                });
                api.subscribe(function(data) {
                    if (data.type === 'to-env') {
                        env.send(data.payload);
                    }
                });
                env.send({
                    type: 'getHostInfo'
                });
            }

            callback(api);
        });
    }

    var envUnsubscribe = null;
    var iframe = null;

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
