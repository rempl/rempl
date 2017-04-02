var Subscriber = require('../../classes/Subscriber.js');
var makeSync = require('./sync.js');
var subscriber;

module.exports = function(fn) {
    if (!subscriber) {
        subscriber = makeSync(new Subscriber());
    }

    if (typeof fn === 'function') {
        console.warn('[rempl] Passing function to rempl.getSubscriber() is deprecated, please use a return value instead');
        fn(subscriber);
    }

    return subscriber;
};
