var OriginalEventTransport = require('../../src/transport/event.js');
var transports;

function EventTransport(from, to, win) {
    transports.push(new OriginalEventTransport(from, to, win));
}

function createScope() {
    function processMessages(list) {
        return list.map(function(message) {
            return JSON.parse(transports.reduce(function(res, transport) {
                return res
                    .replace(new RegExp('"' + transport.inputChannelId + '"', 'g'), function(m) {
                        return m.replace(/:[^"]+/, ':...');
                    })
                    .replace(new RegExp('"' + transport.outputChannelId + '"', 'g'), function(m) {
                        return m.replace(/:[^"]+/, ':...');
                    });
            }, JSON.stringify(message.data)));
        });
    }

    function tick() {
        if (queue.length === 0) {
            var offset = start;
            start = messages.length;
            timer = null;
            done(processMessages(messages.slice(offset)));
        } else {
            var message = queue.shift();
            listeners.slice().forEach(function(listener) {
                listener(message);
            });

            timer = setImmediate(tick);
        }
    }

    var timer = null;
    var done = null;
    var listeners = [];
    var queue = [];
    var messages = [];
    var start = 0;

    global.addEventListener = function(event, fn, capture) {
        if (event !== 'message' || capture) {
            throw new Error('Bad argument(s) for addEventListener');
        }

        listeners.push(fn);
    };
    global.postMessage = function(data, origin) {
        var message = {
            source: global,
            target: global,
            origin: origin,
            data: data
        };
        messages.push(message);
        queue.push(message);
    };

    transports = [];
    timer = setImmediate(tick);

    return {
        messages: messages,
        await: function(fn) {
            done = fn;
            if (!timer) {
                timer = setImmediate(tick);
            }
        },
        dump: function(array) {
            console.log((array || messages).map(x =>
                JSON.stringify(x)
                    .replace(/"([^"]+)":/g, '$1: ')
                    .replace(/"/g, '\'')
                    .replace(/([,{])/g, '$1 ')
                    .replace(/}/g, ' }')
            ).join(',\n'));
        },
        destroy: function() {
            clearImmediate(timer);
            listeners = null;
            queue = null;
            messages = null;
            delete global.postMessage;
            delete global.addEventListener;
        }
    };
}

module.exports = {
    EventTransport: EventTransport,
    createScope: createScope
};
