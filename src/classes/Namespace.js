var Namespace = function(name, owner) {
    this.name = name;
    this.owner = owner;
    this.methods = Object.create(null);
    this.remoteMethods = [];
    this.listeners = null;
};

Namespace.prototype = {
    isMethodProvided: function(methodName) {
        return methodName in this.methods;
    },
    provide: function(methodName, fn) {
        if (typeof methodName === 'string') {
            if (typeof fn === 'function') {
                this.methods[methodName] = fn;
            }
        } else {
            var methods = methodName;
            for (methodName in methods) {
                if (this.isMethodProvided(methodName) &&
                    typeof methods[methodName] === 'function') {
                    this.methods[methodName] = methods[methodName];
                }
            }
        }
    },
    revoke: function(methodName) {
        if (Array.isArray(methodName)) {
            methodName.forEach(this.revoke, this);
        } else {
            if (this.isMethodProvided(methodName)) {
                delete this.methods[methodName];
            }
        }
    },

    isRemoteMethodExists: function(methodName) {
        return this.remoteMethods.indexOf(methodName) !== -1;
    },
    callRemote: function(method/*, ...args, callback*/) {
        var args = Array.prototype.slice.call(arguments, 1);
        var callback = null;

        if (args.length && typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }

        Namespace.send(this.owner, [{
            type: 'call',
            ns: this.name,
            method: method,
            args: args
        }, callback]);
    },

    on: function(eventName, callback) {
        this.listeners = {
            event: eventName,
            callback: callback,
            listeners: this.listeners
        };
    },
    off: function(eventName, callback) {
        var cursor = this.listeners;
        var prev = this;

        while (cursor !== null) {
            if (cursor.event === eventName && cursor.callback === callback) {
                prev.listeners = cursor.listeners;
                break;
            }

            prev = cursor;
            cursor = cursor.listeners;
        }
    }
};

Namespace.invoke = function invoke(namespace, method, args, callback) {
    // add a callback to args even if no callback, to avoid extra checking
    // that callback is passed by remote side
    args = args.concat(typeof callback === 'function' ? callback : function() {});

    // invoke the provided remote method
    namespace.methods[method].apply(null, args);
};

Namespace.emit = function(namespace, eventName/*, ...args*/) {
    var cursor = namespace.listeners;
    var args = Array.prototype.slice.call(arguments, 2);

    while (cursor !== null) {
        if (cursor.event === eventName) {
            cursor.callback.apply(null, args);
        }
        cursor = cursor.listeners;
    }
};

Namespace.send = function send(owner, args) {
    for (var channel in owner.channels) {
        if (typeof owner.channels[channel] === 'function') {
            owner.channels[channel].apply(null, args);
        }
    }
};

module.exports = Namespace;
