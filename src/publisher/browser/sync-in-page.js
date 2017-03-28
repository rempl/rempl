/* eslint-env browser */
var createSandbox = require('../../sandbox/index.js');

module.exports = function(publisher, callback) {
    // disable it by default since it's a basic implementation
    if (true) {
        return;
    }

    if (typeof document === 'undefined') {
        return;
    }

    var container = document.createElement('div');
    container.style = 'position:fixed;z-index:100000;left:0;right:0;bottom:0;height:50%;border-top:2px solid #AAA;background:#EEE;opacity:.9';
    container.innerHTML = '<style>iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;background:white}</style>';
    document.documentElement.appendChild(container);

    publisher.getRemoteUI({}, function(error, type, content) {
        createSandbox({
            container: container,
            type: type,
            content: content
        }, function(api) {
            callback(api);
            api.send({
                type: 'publisher:connect'
            });
        });
    });
};
