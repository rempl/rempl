var utils = require('../utils/index.js');
var createEnv = require('./publisher.js');
var getEnv = require('./subscriber.js');

console.log(utils.isNode);
if (utils.isNode) {
    module.exports = {
        createEnv: function() {
            throw new Error('[rempl] createEnv() doesn\'t supported for node.js');
        },
        getEnv: function() {
            throw new Error('[rempl] getEnv() doesn\'t supported for node.js');
        }
    };
} else {
    module.exports = {
        createEnv: createEnv,
        getEnv: getEnv
    };
}
