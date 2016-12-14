var Publisher = require('../Publisher.js');
var Transport = require('./client');
var makeSync = require('./sync.js');

module.exports = Publisher.factory(function(id, getRemoteUI, endpoint) {
    return makeSync(new Publisher(id, getRemoteUI), new Transport(endpoint || 'ws://localhost:8177'));
});
