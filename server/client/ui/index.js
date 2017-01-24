/* eslint-env browser */
/* global resource */

var Node = require('basis.ui').Node;
var transport = require('../transport.js');
var clients = require('./clients.js');

var mainView = new Node({
    template: resource('./template/layout.tmpl'),
    binding: {
        online: transport.online,
        clients: 'satellite:',
        sandbox: 'satellite:'
    },
    action: {
        pick: function() {
            clients.pickMode.set(true);
            transport.pickClient(function(clientId, publisherId) {
                clients.pickMode.set(false);
                clients.selectedId.set(clientId + '/' + publisherId);
            }.bind(this));
        }
    },
    satellite: {
        clients: clients,
        sandbox: {
            delegate: clients.selectedPublisher,
            instance: require('./sandbox.js')
        }
    },
    dropSelection: function() {
        clients.selectedId.set(null);
    }
});

clients.selectedId.link(null, function() {
    if (clients.pickMode.value) {
        transport.cancelClientPick();
    }
});
transport.online.link(clients.pickMode, function(online) {
    if (!online) {
        this.set(false);
    }
});

module.exports = mainView;
