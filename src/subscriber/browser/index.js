var Subscriber = require('../../classes/Subscriber.js');
var makeSync = require('./sync.js');
var subscriber;

module.exports = function(fn) {
    if (!subscriber) {
        subscriber = makeSync(new Subscriber());
    }

    fn(subscriber);
};
