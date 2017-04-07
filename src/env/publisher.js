var EventTransport = require('../transport/event.js');
var Publisher = require('../classes/Publisher.js');

module.exports = function createEnv(id) {
    var env = new Publisher(id);

    env.linkWindow = function(target) {
        EventTransport
            .get('rempl-env-publisher', 'rempl-env-subscriber', target)
            .sync(env);
    };

    return env;
};
