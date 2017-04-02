var WSTransport = require('./transport-ws.js');

module.exports = function createSync(publisher) {
    // ws server
    WSTransport
        .create(publisher.wsendpoint)
        .sync(publisher);

    return publisher;
};
