/* eslint-env browser */
/* global resource, basis */

var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var ObjectMerge = require('basis.data.object').Merge;
var router = require('basis.router');
var Client = require('../type.js').Client;
var Provider = require('../type.js').Provider;

var selectedId = new Value();
var pickMode = new Value({ value: false });
var selectedProvider = selectedId.as(Provider.getSlot);
var selectedClient = selectedProvider.query('data.clientId').as(Client.getSlot);
var selectedOnline = selectedClient.query('data.online');
var selected = new ObjectMerge({
    sources: {
        client: selectedClient,
        provider: selectedProvider
    },
    fields: {
        id: 'provider:id',
        '*': 'client',
        clientId: 'provider',
        name: 'provider',
        uiType: 'provider',
        uiContent: 'provider'
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
        disabled: Value.query('data.providers.itemCount').as(basis.bool.invert),

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
                    selectedId.set(this.data.providers.pick().data.id);
                }
            }
        },

        dataSource: Value.query('data.providers'),
        childClass: {
            template: resource('./template/provider.tmpl'),
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
    selectedProvider: selected,
    dropSelection: function() {
        selectedId.set(null);
    }
});
