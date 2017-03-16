/* eslint-env browser */
/* global io, basis */

var Value = require('basis.data').Value;
var Endpoint = require('./type.js').Endpoint;
var Publisher = require('./type.js').Publisher;
var online = new Value({ value: false });
var socket = io.connect(location.host, { transports: ['websocket', 'polling'] });

function syncEndpointList(data) {
    Endpoint.all.setAndDestroyRemoved(basis.array(data).map(Endpoint.reader));
}

// connection events
socket
    .on('connect', function() {
        socket.emit('rempl:host connect', function(data) {
            syncEndpointList(data.endpoints);
            online.set(true);
        });
    })
    .on('rempl:endpointList', syncEndpointList)
    .on('disconnect', function() {
        online.set(false);
    });

module.exports = {
    online: online,
    getPublisherUI: function(id, callback) {
        var publisher = Publisher(id);
        socket.emit('rempl:get publisher ui', publisher.data.endpointId, publisher.data.name, function(err, type, content) {
            publisher.update({
                uiType: type,
                uiContent: content
            });
            callback(err, type, content);
        });
    },
    pickPublisher: function(callback) {
        socket.emit('rempl:pick publisher', callback);
    },
    cancelPublisherPick: function() {
        socket.emit('rempl:cancel publisher pick');
    }
};
