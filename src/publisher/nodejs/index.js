var Publisher = require('../../classes/Publisher.js');
var makeSync = require('./sync.js');

module.exports = Publisher.factory(function(id, getRemoteUI, options) {
    var publisher = new Publisher(id, getRemoteUI);

    if (options && options.manualSync) {
        publisher.sync = function() {
            makeSync(publisher);
        };
    } else {
        makeSync(publisher);
    }

    return publisher;
});
