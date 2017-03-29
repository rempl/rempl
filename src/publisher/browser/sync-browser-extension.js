var EventTransport = require('../../transport/event.js');

module.exports = new EventTransport('rempl-browser-extension-publisher', 'rempl-browser-extension-host').onInit;
