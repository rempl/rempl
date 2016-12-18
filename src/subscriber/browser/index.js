var Subscriber = require('../Subscriber.js');
var makeSync = require('./sync.js');
var subscriber;

module.exports = function(fn) {
    if (!subscriber) {
        subscriber = makeSync(new Subscriber());
    }

    fn(subscriber);
};
