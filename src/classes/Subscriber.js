var Namespace = require('../classes/Namespace.js');
var Endpoint = require('../classes/Endpoint.js');
var utils = require('../utils/index.js');

var SubscriberNamespace = function(name, owner) {
    Namespace.call(this, name, owner);

    this.subscribers = [];
};

SubscriberNamespace.prototype = Object.create(Namespace.prototype);
SubscriberNamespace.prototype._lastData = null;
SubscriberNamespace.prototype.subscribe = function(fn) {
    this.callRemote('init', fn);
    return utils.subscribe(this.subscribers, fn);
};

var Subscriber = function(id) {
    Endpoint.call(this, id);

    this.connected.on(function(connected) {
        if (connected) {
            this.requestRemoteApi();
            for (var name in this.namespaces) {
                var ns = this.namespaces[name];
                if (ns.subscribers.length) {
                    ns.callRemote('init', function(data) {
                        this.subscribers.forEach(function(callback) {
                            callback(data);
                        });
                    }.bind(ns));
                }
            }
        } else {
            this.setRemoteApi();
        }
    }, this);
};

Subscriber.prototype = Object.create(Endpoint.prototype);
Subscriber.prototype.namespaceClass = SubscriberNamespace;
Subscriber.prototype.getName = function() {
    return 'Subscriber';
};
Subscriber.prototype.processInput = function(packet, callback) {
    switch (packet.type) {
        case 'data':
            this.ns(packet.ns || '*').subscribers.slice().forEach(function(callback) {
                callback(packet.payload);
            });
            break;

        default:
            Endpoint.prototype.processInput.call(this, packet, callback);
    }
};

module.exports = Subscriber;
