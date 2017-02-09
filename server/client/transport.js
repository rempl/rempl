/* eslint-env browser */
/* global io, basis */

var Value = require('basis.data').Value;
var Client = require('./type.js').Client;
var Publisher = require('./type.js').Publisher;
var online = new Value({ value: false });
var socket = io.connect(location.host, { transports: ['websocket', 'polling'] });

function syncEndpointList(data) {
    Client.all.setAndDestroyRemoved(basis.array(data).map(Client.reader));
}

// connection events
socket
    .on('connect', function() {
        socket.emit('rempl:subscriber connect', function(data) {
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
    getClientUI: function(id, callback) {
        var publisher = Publisher(id);
        socket.emit('rempl:get publisher ui', publisher.data.clientId, publisher.data.name, function(err, type, content) {
            publisher.update({
                uiType: type,
                uiContent: content
            });
            callback(err, type, content);
        });
    },
    pickClient: function(callback) {
        socket.emit('rempl:pick publisher', callback);
    },
    cancelClientPick: function() {
        socket.emit('rempl:cancel publisher pick');
    }
};
