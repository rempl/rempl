/* eslint-env browser */
/* global basis */

var createEnv = require('rempl:env/createEnv.js');
var endpoint = require('./endpoint.js');
var subscribers = [];
var env = null;

// host inside some enviroment
if (top !== window) {
    // create env
    env = createEnv(top, 'env-transport');
    env.subscribe(function(payload) {
        switch (payload.type) {
            case 'setPublisher':
                var publisher = payload.publisher;

                if (publisher && publisher.id) {
                    endpoint.selectById(publisher.id);
                }
                break;

            default:
                var args = basis.array(arguments);

                subscribers.slice().forEach(function(fn) {
                    fn.apply(null, args);
                });
        }
    });

    endpoint.selected.addHandler({
        update: function() {
            env.send({
                type: 'publisherChanged',
                publisher: this.data.id
                    ? basis.object.slice(this.data, [
                        'id',
                        'name',
                        'type'
                      ])
                    : null
            });
        }
    });
}

module.exports = {
    send: function() {
        if (env !== null) {
            env.send.apply(env, arguments);
        }
    },
    subscribe: function(fn) {
        subscribers.push(fn);

        return function() {
            basis.array.remove(subscribers, fn);
        };
    }
};
