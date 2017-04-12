var assert = require('assert');
var methods = ['log', 'info', 'warn', 'error'];

module.exports = function(fn, expected) {
    var messages = [];
    var original = methods.reduce(function(original, name) {
        original[name] = console[name];
        console[name] = function() {
            messages.push({
                type: name,
                args: Array.prototype.slice.call(arguments)
            });
        };
        return original;
    }, {});

    try {
        fn();
        assert.deepEqual(messages, expected);
    } finally {
        // restore
        methods.forEach(function(name) {
            console[name] = original[name];
        });
    }
};
