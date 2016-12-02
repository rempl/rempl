var Observer = require('../observer.js');
var Client = require('./client');
var makeSync = require('./sync.js');

module.exports = Observer.factory(function(id, getRemoteUI, endpoint) {
    return makeSync(new Observer(id, getRemoteUI), new Client(endpoint || '//localhost:8123'));
});
