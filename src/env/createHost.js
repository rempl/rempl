var EventTransport = require('../transport/event.js');

module.exports = function createHost(win, fn) {
    new EventTransport('rempl-host', 'rempl-env', {
        env: win
    }).onInit({}, fn);
};
