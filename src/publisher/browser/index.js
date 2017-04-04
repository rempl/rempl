var Publisher = require('../../classes/Publisher.js');
var EventTransport = require('../../transport/event.js');
var WSTransport = require('./transport-ws.js');

Publisher.onPublishersChange = require('./identify.js').updatePublisherList;

module.exports = Publisher.factory(function makeSync(publisher) {
    // browser extension
    EventTransport
        .create('rempl-browser-extension-publisher', 'rempl-browser-extension-host')
        .sync(publisher);

    // in page
    EventTransport
        .create('rempl-inpage-publisher', 'rempl-inpage-host')
        .sync(publisher);

    // ws server
    WSTransport
        .create(publisher.wsendpoint)
        .sync(publisher);
});
