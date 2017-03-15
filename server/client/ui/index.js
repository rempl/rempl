/* eslint-env browser */
/* global resource */

var Node = require('basis.ui').Node;
var transport = require('../transport.js');
var endpoint = require('../endpoint.js');

module.exports = new Node({
    template: resource('./template/layout.tmpl'),
    binding: {
        online: transport.online,
        pickMode: endpoint.isPickMode,
        endpoints: 'satellite:',
        sandbox: 'satellite:'
    },
    action: {
        togglePublisherPick: function() {
            endpoint.togglePickMode();
        }
    },
    satellite: {
        endpoints: require('./endpoint-list.js'),
        sandbox: {
            delegate: endpoint.selected,
            instance: require('./sandbox.js')
        }
    },
    dropSelection: function() {
        endpoint.unselect();
    }
});
