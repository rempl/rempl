var syncEnv = require('./sync-env.js');
var globalEnv;

module.exports = function createEnv(win, id, fn) {
    if (globalEnv) {
        return fn(globalEnv);
    }

    syncEnv(win, id, function(env) {
        globalEnv = env;
        fn(env);
    });
};
