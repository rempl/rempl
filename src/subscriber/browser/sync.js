/* eslint-env browser */
var EventTransport = require('../../transport/event.js');

module.exports = function createSync(subscriber) {
    EventTransport
        .create('rempl-subscriber', 'rempl-sandbox', opener || parent)
        .sync(subscriber);

    return subscriber;
};
