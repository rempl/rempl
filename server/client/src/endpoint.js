/* eslint-env browser */

var Value = require('basis.data').Value;
var ObjectMerge = require('basis.data.object').Merge;
var Endpoint = require('./type.js').Endpoint;
var Publisher = require('./type.js').Publisher;
var router = require('basis.router');
var transport = require('./transport.js');

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
        uiType: 'publisher',
        uiContent: 'publisher',
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
    } else {
        // link with router
        route.link(selectedId, selectedId.set);
        selectedId.link(location, function(value) {
            this.hash = value || '';
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
