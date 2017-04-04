var Publisher = require('../../classes/Publisher.js');
var WSTransport = require('./transport-ws.js');

function makeSync(publisher) {
    // ws server
    WSTransport
        .create(publisher.wsendpoint)
        .sync(publisher);
}

module.exports = Publisher.factory(function(publisher, options) {
    if (options && options.manualSync) {
        publisher.sync = function() {
            makeSync(publisher);
        };
    } else {
        makeSync(publisher);
    }
});
