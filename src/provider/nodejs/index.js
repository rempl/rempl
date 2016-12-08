var Provider = require('../Provider.js');
var Client = require('./client');
var makeSync = require('./sync.js');

module.exports = Provider.factory(function(id, getRemoteUI, endpoint) {
    return makeSync(new Provider(id, getRemoteUI), new Client(endpoint || '//localhost:8177'));
});
