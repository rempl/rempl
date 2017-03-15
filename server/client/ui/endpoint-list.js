/* eslint-env browser */
/* global resource, basis */

var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var Endpoint = require('../type.js').Endpoint;
var endpoint = require('../endpoint.js');

module.exports = new Node({
    template: resource('./template/endpoint-list.tmpl'),

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
            pickMode: endpoint.isPickMode
        },
        action: {
            select: function() {
                if (!this.isDisabled()) {
                    endpoint.selectById(this.data.publishers.pick().data.id);
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
                    endpoint.selectById(this.data.id);
                }
            }
        }
    }
});
