var EventTransport = require('../transport/event.js');

module.exports = function initSandbox(win, name, fn) {
    new EventTransport('rempl-sandbox', 'rempl-subscriber', {
        name: name,
        env: win
    }).onInit({ id: name }, fn);
};
