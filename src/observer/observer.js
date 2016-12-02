var utils = require('../utils/index.js');
var instances = Object.create(null);

function send(observer, args) {
    for (var channel in observer.channels) {
        observer.channels[channel].apply(null, args);
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

var Namespace = function(name, observer) {
    this.name = name;
    this.observer = observer;
    this.methods = Object.create(null);
    this.subscribers = [];
};

Namespace.prototype = {
    send: function(payload) {
        send(this.observer, [{
            type: 'data',
            ns: this.name,
            payload: payload
        }]);
    },
    subscribe: function(fn) {
        this.subscibers.push(fn);
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

        send(this.observer, [{
            type: 'call',
            ns: this.name,
            method: method,
            args: args
        }, callback]);
    }
};

var Observer = function(id, getRemoteUI) {
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

Observer.prototype = {
    ns: function getNamespace(name) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = new Namespace(name, this);
        }

        return this.namespaces[name];
    },
    processInput: function(packet, callback) {
        var ns = packet.ns || '*';

        if (!this.ns(ns).hasMethod(packet.method)) {
            return console.warn('[rempl][sync] Observer `' + this.name + '` has no remote command:', packet.method);
        }

        invoke.call(this.ns(ns), packet.method, packet.args, callback);
    }
};

Observer.factory = function createObserverFactory(Observer) {
    return function getObserver(id, getRemoteUI, endpoint) {
        var observer = instances[id];

        if (!observer) {
            observer = instances[id] = new Observer(id, getRemoteUI, endpoint);
        }

        return observer;
    };
};

module.exports = Observer;
