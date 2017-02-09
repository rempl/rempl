/* eslint-env browser */
/* global resource */

var Node = require('basis.ui').Node;
var transport = require('../transport.js');
var endpoints = require('./endpoints.js');

var mainView = new Node({
    template: resource('./template/layout.tmpl'),
    binding: {
        online: transport.online,
        endpoints: 'satellite:',
        sandbox: 'satellite:'
    },
    action: {
        pick: function() {
            endpoints.pickMode.set(true);
            transport.pickPublisher(function(endpointId, publisherId) {
                endpoints.pickMode.set(false);
                endpoints.selectedId.set(endpointId + '/' + publisherId);
            }.bind(this));
        }
    },
    satellite: {
        endpoints: endpoints,
        sandbox: {
            delegate: endpoints.selectedPublisher,
            instance: require('./sandbox.js')
        }
    },
    dropSelection: function() {
        endpoints.selectedId.set(null);
    }
});

endpoints.selectedId.link(null, function() {
    if (endpoints.pickMode.value) {
        transport.cancelPublisherPick();
    }
});
transport.online.link(endpoints.pickMode, function(online) {
    if (!online) {
        this.set(false);
    }
});

module.exports = mainView;
