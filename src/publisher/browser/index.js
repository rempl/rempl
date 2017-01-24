var Publisher = require('../../classes/Publisher.js');
var makeSync = require('./sync.js');

Publisher.onPublishersChange = require('./identify.js').updatePublisherList;

module.exports = Publisher.factory(function(id, getRemoteUI) {
    return makeSync(new Publisher(id, getRemoteUI));
});
