var complete = require('../utils/index.js').complete;
var Value = require('../utils/Value.js');
var inspect = new Value({
  proxy: function(value){
    return value || false;
  }
});

function createOutputChannel(observer, ns, channel, send){
    function sendData(){
        send({
            type: ns,
            payload: channel.value
        });
    }

    channel.link(null, sendData, true);

    this.api[ns].channel = channel;
    this.api[ns].init = this.api[ns].init || function(callback){
        callback(channel.value);
    };

    return channel;
}

var Observer = function(id, getRemoteUI) {
    this.id = id;
    this.getRemoteUI = getRemoteUI;
    this.api = {};
    this.session = new Value(null);
    this.connected = new Value(false, Boolean);
    this.features = new Value([], function(features) {
        return Array.isArray(features) ? features : [];
    });
};

Observer.prototype = {
    ns: function getNamespace(name){
        if (!this.api[name]) {
            this.api[name] = {
                channel: function(channel, send){
                    return createOutputChannel.call(this, name, channel || new Value(), send);
                }.bind(this)
            };
        }

        return this.api[name];
    },

    define: function(ns, extension){
        return complete(this.ns(ns), extension);
    }
};

module.exports = Observer;
