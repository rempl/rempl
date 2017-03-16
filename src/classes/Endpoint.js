var Namespace = require('./Namespace.js');
var utils = require('../utils/index.js');

var Endpoint = function() {
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

Endpoint.prototype = {
    namespaceClass: Namespace,
    getName: function() {
        return 'Endpoint';
    },
    ns: function getNamespace(name) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = new this.namespaceClass(name, this);
        }

        return this.namespaces[name];
    },
    setRemoteApi: function(api) {
        var changed = [];

        for (var name in api) {
            if (Array.isArray(api[name])) {
                var ns = this.ns(name);
                var methods = api[name].slice().sort();
                var different = ns.remoteMethods.some(function(value, idx) {
                    return value !== methods[idx];
                });

                if (different) {
                    ns.remoteMethods = methods;
                    changed.push(ns);
                }
            }
        }

        for (var name in this.namespaces) {
            if (Array.isArray(api[name]) === false) {
                var ns = this.namespaces[name];

                ns.remoteMethods = [];
                changed.push(ns);
            }
        }

        changed.forEach(function(ns) {
            Namespace.emit(ns, 'remoteMethodsChanged');
        });
    },
    getProvidedApi: function() {
        var api = {};

        for (var name in this.namespaces) {
            api[name] = Object.keys(this.namespaces[name].methods).sort();
        }

        return api;
    },
    getRemoteApi: function() {
        var api = {};

        for (var name in this.namespaces) {
            api[name] = Object.keys(this.namespaces[name].methods).sort();
        }

        return api;
    },
    processInput: function(packet, callback) {
        var ns = this.ns(packet.ns || '*');

        if (packet.type === 'call') {
            if (!ns.isMethodProvided(packet.method)) {
                return utils.warn('[rempl][sync] ' + this.getName() + ' (namespace: ' + (packet.ns || 'default') + ') has no remote method:', packet.method);
            }

            Namespace.invoke(ns, packet.method, packet.args, callback);
        } else {
            utils.warn('[rempl][sync] Unknown packet type:', packet.type);
        }
    }
};

module.exports = Endpoint;
