var createProxy = require('./createProxy.js');

module.exports = function createHost(win) {
    return createProxy('rempl-host', 'rempl-env', win);
};
