var utils = require('../utils/index.js');
var createEnv = require('./createEnv.js');
var env = null;

module.exports = function getEnv() {
    if (env === null) {
        env = createEnv();
    }

    return env;
};

if (utils.isNode) {
    module.exports = function() {
        throw new Error('[rempl] getEnv() doesn\'t supported on node.js');
    };
};
