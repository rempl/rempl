/* eslint-env browser */
/* global io, basis */

var Value = require('basis.data').Value;
var Client = require('./type.js').Client;
var Observer = require('./type.js').Observer;
var online = new Value({ value: false });
var socket = io.connect(location.host, { transports: ['websocket', 'polling'] });

function syncClientList(data){
  Client.all.setAndDestroyRemoved(basis.array(data).map(Client.reader));
}

// connection events
socket
  .on('connect', function(){
    socket.emit('devtool:customer connect', function(data){
      syncClientList(data.clients);
      online.set(true);
    });
  })
  .on('devtool:clientList', syncClientList)
  .on('disconnect', function(){
    online.set(false);
  });

module.exports = {
  online: online,
  getClientUI: function(id, callback){
    var observer = Observer(id);
    socket.emit('devtool:get client ui', observer.data.clientId, observer.data.name, function(err, type, content){
      observer.update({
        uiType: type,
        uiContent: content
      });
      callback(err, type, content);
    });
  },
  pickClient: function(callback){
    socket.emit('devtool:pick client', callback);
  },
  cancelClientPick: function(){
    socket.emit('devtool:cancel client pick');
  }
};
