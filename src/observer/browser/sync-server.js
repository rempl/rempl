var GLOBAL_NAME = 'basisjsToolsFileSync';  // TODO: rename
var utils = require('../../utils/index.js');
var initCallbacks = [];
var remplWsServer = null;

function init(observer, callback) {
    if (!remplWsServer) {
        initCallbacks.push(arguments);
        return;
    }

    if (typeof remplWsServer.initRemoteObserver === 'function') {
        callback(remplWsServer.initRemoteObserver(observer.id, observer.getRemoteUI));
    }
}

// run via basis.ready to ensure GLOBAL_NAME is loaded
utils.ready(function() {
    remplWsServer = global[GLOBAL_NAME];

    if (!remplWsServer) {
        utils.warn('[rempl] ' + GLOBAL_NAME + ' is not found');
        return;
    }

    // invoke onInit callbacks
    initCallbacks.splice(0).forEach(function(args) {
        init.apply(null, args);
    });
});

module.exports = init;
