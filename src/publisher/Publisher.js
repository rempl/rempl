var hasOwnProperty = Object.prototype.hasOwnProperty;
var utils = require('../utils/index.js');
var publishers = Object.create(null);

function send(publisher, args) {
    for (var channel in publisher.channels) {
        if (typeof publisher.channels[channel] === 'function') {
            publisher.channels[channel].apply(null, args);
        }
    }
}

function invoke(method, args, callback) {
    if (typeof callback === 'function') {
        args = args.concat(callback);
    }

    this.methods[method].apply(null, args);
}

var Namespace = function(name, publisher) {
    this.name = name;
    this.publisher = publisher;
    this.methods = Object.create(null);
    this.methods.init = function(callback) {
        callback(this._lastData);
    }.bind(this);
};

Namespace.prototype = {
    _lastData: null,

    publish: function(payload) {
        this._lastData = payload;
        send(this.publisher, [{
            type: 'data',
            ns: this.name,
            payload: payload
        }]);
    },

    hasMethod: function(method) {
        return method in this.methods;
    },
    provide: function(name, fn) {
        if (typeof name === 'string') {
            if (typeof fn === 'function') {
                this.methods[name] = fn;
            }
        } else {
            var methods = name;
            for (name in methods) {
                if (hasOwnProperty.call(methods, name) &&
                    typeof methods[name] === 'function') {
                    this.methods[name] = methods[name];
                }
            }
        }
    },
    invoke: function(method/*, ...args, callback*/) {
        var args = Array.prototype.slice.call(arguments, 1);
        var callback = null;

        if (args.length && typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }

        send(this.publisher, [{
            type: 'call',
            ns: this.name,
            method: method,
            args: args
        }, callback]);
    }
};

var Publisher = function(id, getRemoteUI) {
    this.id = id;
    this.getRemoteUI = getRemoteUI;
    this.namespaces = Object.create(null);
    this.channels = Object.create(null);
    this.processInput = this.processInput.bind(this);

    var defaultNS = this.ns('*');
    for (var method in defaultNS) {
        if (typeof defaultNS[method] === 'function') {
            this[method] = defaultNS[method].bind(defaultNS);
        }
    }

    publishers[id] = this;
    Publisher.onPublishersChange(Object.keys(publishers));
};

Publisher.prototype = {
    ns: function getNamespace(name) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = new Namespace(name, this);
        }

        return this.namespaces[name];
    },
    processInput: function(packet, callback) {
        var ns = packet.ns || '*';

        switch (packet.type) {
            case 'call':
                if (!this.ns(ns).hasMethod(packet.method)) {
                    return console.warn('[rempl][sync] Publisher `' + this.name + '` has no remote command:', packet.method);
                }

                invoke.call(this.ns(ns), packet.method, packet.args, callback);
                break;

            default:
                utils.warn('[rempl][sync] Unknown packet type:', packet.type);
        }
    }
};

Publisher.onPublishersChange = function(/* publishers */) {
    /* stub method */
};

Publisher.factory = function createPublisherFactory(Publisher) {
    return function getPublisher(id, getRemoteUI, endpoint) {
        var publisher = publishers[id];

        if (!publisher) {
            publisher = new Publisher(id, getRemoteUI, endpoint);
        }

        return publisher;
    };
};

module.exports = Publisher;
