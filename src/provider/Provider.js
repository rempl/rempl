var utils = require('../utils/index.js');
var instances = Object.create(null);

function send(provider, args) {
    for (var channel in provider.channels) {
        provider.channels[channel].apply(null, args);
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

var Namespace = function(name, provider) {
    this.name = name;
    this.provider = provider;
    this.methods = Object.create(null);
};

Namespace.prototype = {
    send: function(payload) {
        send(this.provider, [{
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

        send(this.provider, [{
            type: 'call',
            ns: this.name,
            method: method,
            args: args
        }, callback]);
    }
};

var Provider = function(id, getRemoteUI) {
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

Provider.prototype = {
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
                    return console.warn('[rempl][sync] Provider `' + this.name + '` has no remote command:', packet.method);
                }

                invoke.call(this.ns(ns), packet.method, packet.args, callback);
                break;

            default:
                utils.warn('[rempl][sync] Unknown packet type:', packet.type);
        }
    }
};

Provider.factory = function createProviderFactory(Provider) {
    return function getProvider(id, getRemoteUI, endpoint) {
        var provider = instances[id];

        if (!provider) {
            provider = instances[id] = new Provider(id, getRemoteUI, endpoint);
        }

        return provider;
    };
};

module.exports = Provider;
