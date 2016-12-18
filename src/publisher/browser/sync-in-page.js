var EventTransport = require('../../transport/event.js');

module.exports = new EventTransport('rempl-publisher', 'rempl-in-page-subscriber').onInit;
