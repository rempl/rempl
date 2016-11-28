var GLOBAL_NAME = 'basisjsToolsFileSync';
var connected = require('api').connected;  // FIXME
var features = require('api').features;    // FIXME
var initCallbacks = [];
var remplDevServer = null;

function init(callback){
    if (!remplDevServer) {
        initCallbacks.push(callback);
        return;
    }

    if (typeof remplDevServer.initRemoteDevtoolAPI === 'function') {
        callback(remplDevServer.initRemoteDevtoolAPI(getInspectorUI));
    }
}

function link(basisValue, btValue){
    btValue.attach(basisValue.set, basisValue);
    basisValue.set(btValue.value);
}

//
// init part
// run via basis.ready to ensure GLOBAL_NAME is loaded
//
basis.ready(function(){
    remplDevServer = global[GLOBAL_NAME];

    if (!remplDevServer) {
        basis.dev.warn('[rempl] ' + GLOBAL_NAME + ' is not found');
        return;
    }

    // sync online
    link(connected, remplDevServer.isOnline);

    // sync features
    if (remplDevServer.features) {
        link(features, remplDevServer.features);
    }

    // invoke onInit callbacks
    initCallbacks.splice(0).forEach(init);
});

module.exports = {
    onInit: init,
    online: connected
};
