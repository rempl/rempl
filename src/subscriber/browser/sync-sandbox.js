/* eslint-env browser */
var EventTransport = require('../../transport/event.js');

module.exports = new EventTransport('rempl-subscriber', 'rempl-sandbox', {
    window: parent
}).onInit;
