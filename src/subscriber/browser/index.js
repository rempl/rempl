/* eslint-env browser */
var Subscriber = require('../../classes/Subscriber.js');
var EventTransport = require('../../transport/event.js');
var subscriber;

module.exports = function(fn) {
    if (!subscriber) {
        subscriber = new Subscriber();
        EventTransport
            .create('rempl-subscriber', 'rempl-sandbox', opener || parent)
            .sync(subscriber);
    }

    if (typeof fn === 'function') {
        console.warn('[rempl] Passing function to rempl.getSubscriber() is deprecated, please use a return value instead');
        fn(subscriber);
    }

    return subscriber;
};
