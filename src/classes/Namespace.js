var hasOwnProperty = Object.prototype.hasOwnProperty;

var Namespace = function(name, owner) {
    this.name = name;
    this.owner = owner;
    this.methods = Object.create(null);
};

Namespace.prototype = {
    hasMethod: function(method) {
        return method in this.methods;
    },
    provide: function(methodName, fn) {
        if (typeof methodName === 'string') {
            if (typeof fn === 'function') {
                this.methods[methodName] = fn;
            }
        } else {
            var methods = methodName;
            for (methodName in methods) {
                if (hasOwnProperty.call(methods, methodName) &&
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
            if (hasOwnProperty.call(this.methods, methodName)) {
                delete this.methods[methodName];
            }
        }
    },
    invoke: function(method/*, ...args, callback*/) {
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
    }
};

Namespace.invoke = function invoke(namespace, method, args, callback) {
    if (typeof callback === 'function') {
        args = args.concat(callback);
    }

    namespace.methods[method].apply(null, args);
};

Namespace.send = function send(owner, args) {
    for (var channel in owner.channels) {
        if (typeof owner.channels[channel] === 'function') {
            owner.channels[channel].apply(null, args);
        }
    }
};

module.exports = Namespace;
