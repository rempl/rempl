var EventTransport = require('./transport/event.js');

module.exports = {
    createPublisher: require('./publisher/index.js'),
    getSubscriber: require('./subscriber/index.js'),
    initSandbox: function(win, name, fn) {
        new EventTransport('rempl-sandbox', 'rempl-subscriber', {
            name: name,
            env: win
        }).onInit({ id: name }, fn);
    },

    scriptFromFile: require('./sdk/scriptFromFile.js')
};
