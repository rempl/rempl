var Namespace = require('../classes/Namespace.js');
var Endpoint = require('../classes/Endpoint.js');
var Token = require('../classes/Token.js');
var setOverlayVisible = require('../subscriber/browser/disconnected-overlay.js');

var SubscriberNamespace = function(name, owner) {
    Namespace.call(this, name, owner);

    this.subscribers = [];
};

SubscriberNamespace.prototype = Object.create(Namespace.prototype);
SubscriberNamespace.prototype._lastData = null;
SubscriberNamespace.prototype.subscribe = function(fn) {
    this.callRemote('init', fn);
    this.subscribers.push(fn);
};

var Subscriber = function() {
    Endpoint.call(this);

    this.connected = new Token(false);
    this.connected.defaultOverlay = true;
    this.connected.link(function(connected) {
        if (connected) {
            setOverlayVisible(false);
        } else if (this.connected.defaultOverlay) {
            setOverlayVisible(true);
        }

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
        case 'publisher:connect':
            this.connected.set(true);
            break;

        case 'publisher:disconnect':
            this.connected.set(false);
            break;

        case 'data':
            this.ns(packet.ns || '*').subscribers.forEach(function(callback) {
                callback(packet.payload);
            });
            break;

        default:
            Endpoint.prototype.processInput.call(this, packet, callback);
    }
};

Subscriber.factory = function createSubscriberFactory(Subscriber) {
    return function createSubscriber(id) {
        return new Subscriber(id);
    };
};

module.exports = Subscriber;
