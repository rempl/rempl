var GLOBAL_NAME = 'basisjsToolsFileSync';  // TODO: rename
var utils = require('../../utils/index.js');
var initCallbacks = [];
var onInit = function() {
    initCallbacks.push(arguments);
};

// run via utils.waitForGlobal to ensure GLOBAL_NAME is available
utils.waitForGlobal(GLOBAL_NAME, function(remplWsServer) {
    if (typeof remplWsServer.initRemoteProvider === 'function') {
        onInit = function(provider, callback) {
            callback(remplWsServer.initRemoteProvider(provider.id, provider.getRemoteUI));
        };
    } else {
        utils.warn('[rempl][sync-server] initRemoteProvider method doesn\'t implemented in rempl server API');
        return;
    }

    // invoke onInit callbacks
    initCallbacks.splice(0).forEach(function(args) {
        onInit.apply(null, args);
    });
});

module.exports = function() {
    onInit.apply(this, arguments);
};
