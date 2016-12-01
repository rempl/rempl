var GLOBAL_NAME = 'basisjsToolsFileSync';  // TODO: rename
var utils = require('../../utils/index.js');
var initCallbacks = [];
var onInit = function() {
    initCallbacks.push(arguments);
};

// run via utils.waitForGlobal to ensure GLOBAL_NAME is available
utils.waitForGlobal(GLOBAL_NAME, function(remplWsServer) {
    if (typeof remplWsServer.initRemoteObserver === 'function') {
        onInit = function(observer, callback) {
            callback(remplWsServer.initRemoteObserver(observer.id, observer.getRemoteUI));
        };
    } else {
        utils.warn('[rempl][sync-server] initRemoteObserver method doesn\'t implemented in rempl server API');
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
