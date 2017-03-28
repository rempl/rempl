/* eslint-env browser */
var EventTransport = require('../../transport/event.js');
var utils = require('../../utils/index.js');
var getEnv = require('../../env/index.js');

module.exports = function createSandbox(settings, callback) {
    settings = settings || {};

    var container = settings.container || document.documentElement;
    var iframe = document.createElement('iframe');
    var envUnsubscribe;

    iframe.name = utils.genUID(); // to avoid cache
    iframe.onload = function() {
        var contentWindow = iframe.contentWindow;

        if (settings.type === 'script') {
            for (var name in settings.content) {
                contentWindow.eval(
                    settings.content[name] +
                    '\n//# sourceURL=' + name
                );
            }
        }

        // host <-> subscriber transport
        // TODO: teardown transport
        new EventTransport('rempl-sandbox', 'rempl-subscriber', {
            name: utils.genUID(),
            window: contentWindow
        }).onInit({}, function(api) {
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
    };

    if (settings.type === 'url') {
        iframe.src = settings.content;
    } else {
        iframe.srcdoc = '<!doctype html>';
    }

    container.appendChild(iframe);

    return {
        destroy: function() {
            if (typeof envUnsubscribe === 'function') {
                envUnsubscribe();
                envUnsubscribe = null;
            }

            iframe.parentNode.removeChild(iframe);
            iframe.setAttribute('srcdoc', '');
            iframe.setAttribute('src', '');
            iframe = null;
        }
    };
};
