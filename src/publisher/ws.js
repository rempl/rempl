function attachWsTransport(publisher, WsTransport, uri) {
    uri = typeof uri === 'string' ? uri : WsTransport.defaultUri;

    if (typeof uri === 'string') {
        WsTransport
            .get(uri)
            .sync(publisher);
    } else {
        console.warn('[rempl] Connection to WS server doesn\'t established since URI is not specified');
    }
}

module.exports = function(publisher, WsTransport, options) {
    publisher.connectWs = function(uri) {
        attachWsTransport(publisher, WsTransport, uri);
    };

    if (!options || options.ws !== false) {
        publisher.connectWs(options && options.ws);
    }
};
