var DomEventTransport = require('../../utils/DomEventTransport.js');

module.exports = function createSync(customer) {
    new DomEventTransport('rempl-in-page-customer', 'rempl-provider').onInit(customer, function() {
        console.log('in-page customer connected');
    });

    return customer;
};
