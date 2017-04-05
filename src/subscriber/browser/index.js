/* eslint-env browser */
var Subscriber = require('../../classes/Subscriber.js');
var EventTransport = require('../../transport/event.js');
var setOverlayVisible = require('./disconnected-overlay.js');
var subscriber = null;

function createSubscriber() {
    subscriber = new Subscriber();

    // default overlay
    subscriber.connected.defaultOverlay = true;
    subscriber.connected.link(function(connected) {
        if (connected) {
            setOverlayVisible(false);
        } else if (this.connected.defaultOverlay) {
            setOverlayVisible(true);
        }
    }, subscriber);

    // link to transport
    EventTransport
        .create('rempl-subscriber', 'rempl-sandbox', opener || parent)
        .sync(subscriber);

    return subscriber;
}

module.exports = function(fn) {
    if (subscriber === null) {
        subscriber = createSubscriber();
    }

    if (typeof fn === 'function') {
        console.warn('[rempl] Passing function to rempl.getSubscriber() is deprecated, please use a return value instead');
        fn(subscriber);
    }

    return subscriber;
};
