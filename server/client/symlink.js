var path = require('path');

// use plugin to resolve basis.js path since it can be placed anywhere in node_modules
module.exports = {
    build: function(api) {
        api.addSymlink('/basis', path.dirname(require.resolve('basisjs')));
        api.addSymlink('/rempl', path.resolve(__dirname, '../../src'));
    }
};
