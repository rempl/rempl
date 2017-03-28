var createHost = require('../../host/in-page/index.js');

module.exports = function(publisher, callback) {
    // disable it by default since it's a basic implementation
    if (true) {
        return;
    }

    return createHost().activate(publisher, callback);
};
