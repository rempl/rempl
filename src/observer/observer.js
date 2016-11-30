var complete = require('../utils/index.js').complete;
// var Value = require('../utils/Value.js');
var instances = Object.create(null);

function send(observer, ns, payload) {
    for (var channel in observer.channels) {
        observer.channels[channel].call(null, {
            ns: ns,
            payload: payload
        });
    }
}

var Namespace = function(name, observer) {
    this.name = name;
    this.observer = observer;
    this.methods = Object.create(null);
};

Namespace.prototype = {
    define: function(methods) {
        console.log('define', this.name, methods);
        complete(this.methods, methods);
    },
    has: function(method) {
        return method in this.methods;
    },
    invoke: function(method, args, callback) {
        if (!this.has(method)) {
            return console.warn('[rempl] Unknown method:', method, this.methods);
        }

        this.methods[method].apply(null, args.concat(callback));
    },
    send: function(payload) {
        send(this.observer, this.name, payload);
    }
};

var Observer = function(id, getRemoteUI) {
    this.id = id;
    this.getRemoteUI = getRemoteUI;
    this.namespaces = Object.create(null);
    this.channels = Object.create(null);

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
