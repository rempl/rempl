var Publisher = require('../Publisher.js');
var makeSync = require('./sync.js');

module.exports = Publisher.factory(function(id, getRemoteUI) {
    return makeSync(new Publisher(id, getRemoteUI));
});
