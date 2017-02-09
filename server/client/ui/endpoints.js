/* eslint-env browser */
/* global resource, basis */

var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var ObjectMerge = require('basis.data.object').Merge;
var router = require('basis.router');
var Endpoint = require('../type.js').Endpoint;
var Publisher = require('../type.js').Publisher;

var selectedId = new Value();
var pickMode = new Value({ value: false });
var selectedPublisher = selectedId.as(Publisher.getSlot);
var selectedEndpoint = selectedPublisher.query('data.endpointId').as(Endpoint.getSlot);
var selectedOnline = selectedEndpoint.query('data.online');
var selected = new ObjectMerge({
    sources: {
        endpoint: selectedEndpoint,
        publisher: selectedPublisher
    },
    fields: {
        id: 'publisher:id',
        endpointId: 'publisher',
        name: 'publisher',
        uiType: 'publisher',
        uiContent: 'publisher',
        '*': 'endpoint'
    }
});

Value
    .from(router.route('*id').param('id'))
    .link(selectedId, selectedId.set);

selectedId.link(location, function(value) {
    this.hash = value || '';
});

module.exports = new Node({
    template: resource('./template/list.tmpl'),
    binding: {
        selectedOnline: selectedOnline
    },

    active: true,
    dataSource: Endpoint.all,
    childClass: {
        disabled: Value.query('data.publishers.itemCount').as(basis.bool.invert),

        template: resource('./template/endpoint.tmpl'),
        binding: {
            title: {
                events: 'update',
                getter: function(node) {
                    return node.data.title || '<no title>';
                }
            },
            isBrowser: Value.query('data.type').as(function(type) {
                return type == 'browser';
            }),
            isNode: Value.query('data.type').as(function(type) {
                return type == 'node';
            }),
            location: 'data:',
            pid: 'data:',
            online: 'data:',
            num: 'data:',
            pickMode: pickMode
        },
        action: {
            select: function() {
                if (!this.isDisabled()) {
                    selectedId.set(this.data.publishers.pick().data.id);
                }
            }
        },

        dataSource: Value.query('data.publishers'),
        childClass: {
            template: resource('./template/publisher.tmpl'),
            binding: {
                name: 'data:'
            },
            action: {
                select: function() {
                    selectedId.set(this.data.id);
                }
            }
        }
    },

    pickMode: pickMode,
    selectedId: selectedId,
    selectedPublisher: selected,
    dropSelection: function() {
        selectedId.set(null);
    }
});
