var EventTransport = require('./transport/event.js');
var Subscriber = require('./subscriber/Subscriber.js');

module.exports = {
    createPublisher: require('./publisher/index.js'),
    getSubscriber: require('./subscriber/index.js'),
    initSandbox: function(name, fn) {
        Subscriber.id = name; // FIXME: temp solution
        new EventTransport('rempl-sandbox', 'rempl-subscriber').onInit({ id: name }, fn);
    },

    scriptFromFile: require('./sdk/scriptFromFile.js')
};
