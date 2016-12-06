var Provider = require('../Provider.js');
var makeSync = require('./sync.js');

module.exports = Provider.factory(function(id, getRemoteUI) {
    return makeSync(new Provider(id, getRemoteUI));
});
