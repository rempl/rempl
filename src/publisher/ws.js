module.exports = function(publisher, WsTransport, options) {
    var uri = false;
    options = options || {};

    publisher.connectWs = function(uri) {
        switch (uri) {
            case 'implicit':
            case undefined:
                uri = WsTransport.settings.explicit || WsTransport.settings.implicit;
                break;

            case 'explicit':
                uri = WsTransport.settings.explicit;
                break;
        }

        if (typeof uri === 'string') {
            WsTransport
                .get(uri)
                .sync(publisher);
        } else {
            console.warn('[rempl] Connection to WS server doesn\'t established since bad value for URI', uri);
        }
    };

    switch (options.ws) {
        case 'implicit':
        case true:
            uri = 'implicit';
            break;

        case 'explicit':
        case undefined:
            uri = 'explicit';
            break;

        case false:
            // decline connection, do nothing
            return;

        default:
            if (typeof options.ws === 'string') {
                uri = options.ws;
            } else {
                console.warn('[rempl] Bad value of `options.ws` option for `createPublisher(.., .., options)`');
                return;
            }
    }

    if (typeof uri === 'string') {
        publisher.connectWs(uri);
    }
};
