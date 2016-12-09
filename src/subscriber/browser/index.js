var Subscriber = require('../Subscriber.js');
var makeSync = require('./sync.js');

module.exports = Subscriber.factory(function(id) {
    return makeSync(new Subscriber(id));
});
