var DomEventTransport = require('../../transport/event.js');

module.exports = new DomEventTransport('rempl-publisher', 'rempl-browser-extension-subscriber').onInit;
