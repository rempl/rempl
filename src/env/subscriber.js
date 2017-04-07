/* eslint-env browser */
var EventTransport = require('../transport/event.js');
var Subscriber = require('../classes/Subscriber.js');
var env = Object.create(null);

module.exports = function getEnv(id) {
    if (id in env === false) {
        env[id] = new Subscriber(id);
        EventTransport
            .get('rempl-env-subscriber', 'rempl-env-publisher', parent)
            .sync(env[id]);
    }

    return env[id];
};
