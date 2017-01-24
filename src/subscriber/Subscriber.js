var Namespace = require('../classes/Namespace.js');
var Endpoint = require('../classes/Endpoint.js');

var SubscriberNamespace = function(name, owner) {
    Namespace.call(this, name, owner);

    this.subscribers = [];
};

SubscriberNamespace.prototype = Object.create(Namespace.prototype);
SubscriberNamespace.prototype._lastData = null;
SubscriberNamespace.prototype.subscribe = function(fn) {
    this.invoke('init', fn);
    this.subscribers.push(fn);
};

var Subscriber = function() {
    Endpoint.call(this);
};

Subscriber.prototype = Object.create(Endpoint.prototype);
Subscriber.prototype.namespaceClass = SubscriberNamespace;
Subscriber.prototype.getName = function() {
    return 'Subscriber';
};
Subscriber.prototype.processInput = function(packet, callback) {
    if (packet.type === 'data') {
        this.ns(packet.ns || '*').subscribers.forEach(function(subscriber) {
            subscriber(packet.payload);
        });
    } else {
        Endpoint.call(this, packet, callback);
    }
};

Subscriber.factory = function createSubscriberFactory(Subscriber) {
    return function createSubscriber(id) {
        return new Subscriber(id);
    };
};

module.exports = Subscriber;
