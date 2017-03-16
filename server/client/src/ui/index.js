/* eslint-env browser */
/* global basis, resource */

var Node = require('basis.ui').Node;
var transport = require('../transport.js');
var endpoint = require('../endpoint.js');

module.exports = new Node({
    template: resource('./template/layout.tmpl'),
    binding: {
        /** @cut */ dev: basis.fn.$const(window !== top),
        online: transport.online,
        pickMode: endpoint.isPickMode,
        endpoints: 'satellite:',
        sandbox: 'satellite:'
    },
    action: {
        reload: function() {
            location.reload();
        },
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
