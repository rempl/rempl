var createProxy = require('./createProxy.js');

module.exports = function createEnv(win, name) {
    return createProxy('rempl-env', 'rempl-host', win, name);
};
