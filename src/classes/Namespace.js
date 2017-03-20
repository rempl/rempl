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
                this.owner.scheduleProvidedMethodsUpdate();
            }
        } else {
            var methods = methodName;
            for (methodName in methods) {
                if (this.isMethodProvided(methodName) &&
                    typeof methods[methodName] === 'function') {
                    this.methods[methodName] = methods[methodName];
                    this.owner.scheduleProvidedMethodsUpdate();
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
                this.owner.scheduleProvidedMethodsUpdate();
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

    onRemoteMethodsChanged: function(callback) {
        var listener = {
            event: 'remoteMethodsChanged',
            callback: callback,
            listeners: this.listeners
        };

        this.listeners = listener;

        callback(this.remoteMethods.slice());

        return function() {
            var cursor = this.listeners;
            var prev = this;

            while (cursor !== null) {
                if (cursor === listener) {
                    prev.listeners = cursor.listeners;
                    break;
                }

                prev = cursor;
                cursor = cursor.listeners;
            }
        }.bind(this);
    }
};

Namespace.invoke = function invoke(namespace, method, args, callback) {
    // add a callback to args even if no callback, to avoid extra checking
    // that callback is passed by remote side
    args = args.concat(typeof callback === 'function' ? callback : function() {});

    // invoke the provided remote method
    namespace.methods[method].apply(null, args);
};

Namespace.notifyRemoteMethodsChanged = function(namespace) {
    var cursor = namespace.listeners;

    while (cursor !== null) {
        if (cursor.event === 'remoteMethodsChanged') {
            cursor.callback.call(null, namespace.remoteMethods.slice());
        }
        cursor = cursor.listeners;
    }
};

Namespace.send = function send(owner, args) {
    owner.channels.forEach(function(channel) {
        channel.send.apply(null, args);
    });
};

module.exports = Namespace;
