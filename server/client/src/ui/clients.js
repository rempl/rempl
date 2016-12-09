/* eslint-env browser */
/* global resource, basis */

var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var ObjectMerge = require('basis.data.object').Merge;
var router = require('basis.router');
var Client = require('../type.js').Client;
var Publisher = require('../type.js').Publisher;

var selectedId = new Value();
var pickMode = new Value({ value: false });
var selectedPublisher = selectedId.as(Publisher.getSlot);
var selectedClient = selectedPublisher.query('data.clientId').as(Client.getSlot);
var selectedOnline = selectedClient.query('data.online');
var selected = new ObjectMerge({
    sources: {
        client: selectedClient,
        publisher: selectedPublisher
    },
    fields: {
        id: 'publisher:id',
        '*': 'client',
        clientId: 'publisher',
        name: 'publisher',
        uiType: 'publisher',
        uiContent: 'publisher'
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
    dataSource: Client.all,
    childClass: {
        disabled: Value.query('data.publishers.itemCount').as(basis.bool.invert),

        template: resource('./template/client.tmpl'),
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
