var syncEnv = require('./sync-env.js');

module.exports = function createEnv(win, id, fn) {
    syncEnv(win, id, fn);
};
