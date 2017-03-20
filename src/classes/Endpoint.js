var Namespace = require('./Namespace.js');
var utils = require('../utils/index.js');

var Endpoint = function() {
    this.namespaces = Object.create(null);
    this.channels = [];
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
    requestRemoteApi: function() {
        Namespace.send(this, [{
            type: 'getProvidedMethods',
            methods: this.getProvidedApi()
        }, function(methods) {
            this.setRemoteApi(methods);
        }.bind(this)]);
    },
    setRemoteApi: function(api) {
        var changed = [];

        for (var name in api) {
            if (Array.isArray(api[name])) {
                var ns = this.ns(name);
                var methods = api[name].slice().sort();
                var different =
                    ns.remoteMethods.length !== methods.length ||
                    ns.remoteMethods.some(function(value, idx) {
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
            Namespace.notifyRemoteMethodsChanged(ns);
        });
    },
    getProvidedApi: function() {
        var api = {};

        for (var name in this.namespaces) {
            api[name] = Object.keys(this.namespaces[name].methods).sort();
        }

        return api;
    },
    scheduleProvidedMethodsUpdate: function() {
        if (!this.providedMethodsUpdateTimer) {
            this.providedMethodsUpdateTimer = setTimeout(function() {
                this.providedMethodsUpdateTimer = null;
                Namespace.send(this, [{
                    type: 'remoteMethods',
                    methods: this.getProvidedApi()
                }]);
            }.bind(this), 0);
        }
    },
    processInput: function(packet, callback) {
        switch (packet.type) {
            case 'call':
                var ns = this.ns(packet.ns || '*');

                if (!ns.isMethodProvided(packet.method)) {
                    return utils.warn('[rempl][sync] ' + this.getName() + ' (namespace: ' + (packet.ns || 'default') + ') has no remote method:', packet.method);
                }

                Namespace.invoke(ns, packet.method, packet.args, callback);
                break;

            case 'remoteMethods':
                this.setRemoteApi(packet.methods);
                break;

            case 'getProvidedMethods':
                callback(this.getProvidedApi());
                break;

            default:
                utils.warn('[rempl][sync] Unknown packet type:', packet.type);
        }
    },
    setupChannel: function(type, send, available) {
        if (available) {
            this.channels.push({
                type: type,
                send: send
            });
        } else {
            for (var i = 0; i < this.channels.length; i++) {
                if (this.channels[i].type === type &&
                    this.channels[i].send === send) {
                    this.channels.splice(i, 1);
                    break;
                }
            }
        }
    }
};

module.exports = Endpoint;
