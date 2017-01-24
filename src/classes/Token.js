/**
 * @class
 */
var Token = function(value) {
    this.value = value;
};

Token.prototype = {
    handler: null,

    /**
     * Set new value and call apply method if value has been changed.
     * @param {*} value
     */
    set: function(value) {
        if (this.value !== value) {
            this.value = value;
            this.apply();
        }
    },

    /**
     * Returns current token value.
     * @returns {*}
     */
    get: function() {
        return this.value;
    },

    /**
     * Adds a callback on token value changes.
     * @param {function(value)} fn
     * @param {object=} context
     */
    on: function(fn, context) {
        var cursor = this;
        while (cursor = cursor.handler) {
            if (cursor.fn === fn && cursor.context === context) {
                console.warn('Token#on: duplicate fn & context pair');
            }
        }

        this.handler = {
            fn: fn,
            context: context,
            handler: this.handler
        };
    },

    /**
     * Adds a callback on token value changes and invokes callback with current value.
     * @param {function(value)} fn
     * @param {object=} context
     */
    link: function(fn, context) {
        this.on(fn, context);
        fn.call(context, this.value);
    },

    /**
     * Removes a callback. Must be passed the same arguments as for Token#on() method.
     * @param {function(value)} fn
     * @param {object=} context
     */
    off: function(fn, context) {
        var cursor = this;
        var prev;

        while (prev = cursor, cursor = cursor.handler) {
            if (cursor.fn === fn && cursor.context === context) {
                // make it non-callable
                cursor.fn = function() {};

                // remove from list
                prev.handler = cursor.handler;

                return;
            }
        }

        console.warn('Token#off: fn & context pair not found, nothing was removed');
    },

    /**
     * Call all callbacks with current token value.
     */
    apply: function() {
        var cursor = this;

        while (cursor = cursor.handler) {
            cursor.fn.call(cursor.context, this.value);
        }
    }
};

module.exports = Token;
