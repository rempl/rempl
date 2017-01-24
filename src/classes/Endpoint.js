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
    processInput: function(packet, callback) {
        var ns = packet.ns || '*';

        if (packet.type === 'call') {
            if (!this.ns(ns).hasMethod(packet.method)) {
                return utils.warn('[rempl][sync] ' + this.getName() + ' has no remote command:', packet.method);
            }

            Namespace.invoke(this.ns(ns), packet.method, packet.args, callback);
        } else {
            utils.warn('[rempl][sync] Unknown packet type:', packet.type);
        }
    }
};

module.exports = Endpoint;
