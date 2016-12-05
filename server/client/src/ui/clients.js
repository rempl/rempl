/* eslint-env browser */
/* global resource, basis */

var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var ObjectMerge = require('basis.data.object').Merge;
var router = require('basis.router');
var Client = require('../type.js').Client;
var Observer = require('../type.js').Observer;

var selectedId = new Value();
var pickMode = new Value({ value: false });
var selectedObserver = selectedId.as(Observer.getSlot);
var selectedClient = selectedObserver.query('data.clientId').as(Client.getSlot);
var selectedOnline = selectedClient.query('data.online');
var selected = new ObjectMerge({
  sources: {
    client: selectedClient,
    observer: selectedObserver
  },
  fields: {
    id: 'observer:id',
    '*': 'client',
    clientId: 'observer',
    name: 'observer',
    uiType: 'observer',
    uiContent: 'observer'
  }
});

Value
  .from(router.route('*id').param('id'))
  .link(selectedId, selectedId.set);

selectedId.link(location, function(value){
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
    disabled: Value.query('data.observers.itemCount').as(basis.bool.invert),

    template: resource('./template/client.tmpl'),
    binding: {
      title: {
        events: 'update',
        getter: function(node){
          return node.data.title || '<no title>';
        }
      },
      isBrowser: Value.query('data.type').as(function(type){
        return type == 'browser';
      }),
      isNode: Value.query('data.type').as(function(type){
        return type == 'node';
      }),
      location: 'data:',
      pid: 'data:',
      online: 'data:',
      num: 'data:',
      pickMode: pickMode
    },
    action: {
      select: function(){
        if (!this.isDisabled())
          selectedId.set(this.data.observers.pick().data.id);
      }
    },

    dataSource: Value.query('data.observers'),
    childClass: {
      template: resource('./template/observer.tmpl'),
      binding: {
        name: 'data:'
      },
      action: {
        select: function(){
          selectedId.set(this.data.id);
        }
      }
    }
  },

  pickMode: pickMode,
  selectedId: selectedId,
  selectedObserver: selected,
  dropSelection: function(){
    selectedId.set(null);
  }
});
