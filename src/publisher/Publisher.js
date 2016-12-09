var utils = require('../utils/index.js');
var instances = Object.create(null);

function send(publisher, args) {
    for (var channel in publisher.channels) {
        publisher.channels[channel].apply(null, args);
    }
}

function invoke(method, args, callback) {
    if (!this.hasMethod(method)) {
        return utils.warn('[rempl] Unknown method:', method, this.methods);
    }

    if (typeof callback === 'function') {
        args = args.concat(callback);
    }

    this.methods[method].apply(null, args);
}

var Namespace = function(name, publisher) {
    this.name = name;
    this.publisher = publisher;
    this.methods = Object.create(null);
};

Namespace.prototype = {
    publish: function(payload) {
        send(this.publisher, [{
            type: 'data',
            ns: this.name,
            payload: payload
        }]);
    },

    hasMethod: function(method) {
        return method in this.methods;
    },
    define: function(methods) {
        utils.complete(this.methods, methods);
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

Publisher.factory = function createPublisherFactory(Publisher) {
    return function getPublisher(id, getRemoteUI, endpoint) {
        var publisher = instances[id];

        if (!publisher) {
            publisher = instances[id] = new Publisher(id, getRemoteUI, endpoint);
        }

        return publisher;
    };
};

module.exports = Publisher;
