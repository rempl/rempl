var EventTransport = require('../transport/event.js');

module.exports = function initEnv(win, name, fn) {
    new EventTransport('rempl-env', 'rempl-host', {
        name: name,
        env: win
    }).onInit({ id: name }, fn);
};
