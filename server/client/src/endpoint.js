/* eslint-env browser */
/* global basis */

var Value = require('basis.data').Value;
var ObjectMerge = require('basis.data.object').Merge;
var Endpoint = require('./type.js').Endpoint;
var Publisher = require('./type.js').Publisher;
var router = require('basis.router');
var transport = require('./transport.js');
var env = require('rempl:env/index.js')();

var route = Value.from(router.route('*id').param('id'));
var selectedId = new Value({
    proxy: function(value) {
        return value && decodeURIComponent(value);
    }
});
var pickMode = new Value({ value: false });
var selectedPublisher = selectedId.as(Publisher.getSlot);
var selectedEndpoint = selectedPublisher.query('data.endpointId').as(Endpoint.getSlot);
var selected = new ObjectMerge({
    sources: {
        endpoint: selectedEndpoint,
        publisher: selectedPublisher
    },
    fields: {
        id: 'publisher:id',
        endpointId: 'publisher',
        name: 'publisher',
        '*': 'endpoint'
    }
});

// link with transport
selectedId.link(null, function() {
    if (pickMode.value) {
        transport.cancelPublisherPick();
    }
});
transport.online.link(pickMode, function(online) {
    if (!online) {
        this.set(false);
    }
});
transport.exclusivePublisher.link(null, function(exclusiveId) {
    if (exclusiveId) {
        route.unlink(selectedId);
        selectedId.unlink(location);
        selectedId.set(exclusiveId);
        document.title = selected.data.name;
    } else {
        document.title = 'Rempl WS server';
        // link with router
        route.link(selectedId, selectedId.set);
        selectedId.link(location, function(value) {
            this.hash = value || '';
        });
    }
});

// link with enviroment
env.subscribe(function(payload) {
    if (payload.type === 'setPublisher') {
        var publisher = payload.publisher;

        if (publisher && publisher.id) {
            selectedId.set(publisher.id);
        }
    }
});
selected.addHandler({
    update: function() {
        env.send({
            type: 'publisherChanged',
            publisher: this.data.id
                ? basis.object.slice(this.data, [
                    'id',
                    'name',
                    'type'
                  ])
                : null
        });
    }
});

module.exports = {
    isPickMode: pickMode,
    selected: selected,
    selectById: function(id) {
        selectedId.set(id);
    },
    unselect: function() {
        selectedId.set(null);
    },
    togglePickMode: function() {
        if (!pickMode.value) {
            pickMode.set(true);
            transport.pickPublisher(function(endpointId, publisherId) {
                pickMode.set(false);
                selectedId.set(endpointId + '/' + publisherId);
            });
        } else {
            pickMode.set(false);
            transport.cancelPublisherPick();
        }
    }
};
