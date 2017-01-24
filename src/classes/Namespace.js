var Namespace = function(name, owner) {
    this.name = name;
    this.owner = owner;
    this.methods = Object.create(null);
};

Namespace.prototype = {
    hasMethod: function(method) {
        return method in this.methods;
    },
    provide: function(name, fn) {
        if (typeof name === 'string') {
            if (typeof fn === 'function') {
                this.methods[name] = fn;
            }
        } else {
            var methods = name;
            for (name in methods) {
                if (hasOwnProperty.call(methods, name) &&
                    typeof methods[name] === 'function') {
                    this.methods[name] = methods[name];
                }
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
