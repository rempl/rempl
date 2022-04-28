import OriginalEventTransport from '../../src/transport/event.js';

const replaceId = new WeakMap<OriginalEventTransport, number>();
let transports;
let callbacks;

class EventTransport extends OriginalEventTransport {
    constructor(from: string, to: string, win?: Window | typeof global) {
        super(from, to, win);

        transports.push(this);
        replaceId.set(this, transports.filter((t) => t.name === from).length); // ???
    }
}

function createScope() {
    function processMessages(list) {
        return list.map(function (message) {
            return JSON.parse(
                transports.reduce(function (res, transport) {
                    return res
                        .replace(
                            new RegExp('"' + transport.inputChannelId + '"', 'g'),
                            function (m) {
                                return m.replace(/:[^"]+/, ':' + replaceId.get(transport));
                            }
                        )
                        .replace(/"callback":\s*"([^"]+)"/g, function (m: string, id: string) {
                            let idx = callbacks.indexOf(id);
                            if (idx === -1) {
                                idx = callbacks.push(id) - 1;
                            }
                            return '"callback":' + (idx + 1);
                        });
                }, JSON.stringify(message.data))
            );
        });
    }

    function tick() {
        if (queue.length === 0) {
            const offset = start;

            start = messages.length;
            timer = null;

            done(processMessages(messages.slice(offset)));
        } else {
            const message = queue.shift();

            listeners.slice().forEach(function (listener) {
                listener(message);
            });

            timer = setTimeout(tick, 0);
        }
    }

    let listeners = [];
    let queue = [];
    let messages = [];
    let timer = null;
    let done = null;
    let start = 0;

    global.addEventListener = function (event, fn, capture) {
        if (event !== 'message' || capture) {
            throw new Error('Bad argument(s) for addEventListener');
        }

        listeners.push(fn);
    };
    global.postMessage = function (data, origin) {
        const message = {
            source: global,
            target: global,
            origin: origin,
            data: data,
        };

        messages.push(message);
        queue.push(message);
    };

    transports = [];
    callbacks = [];
    timer = setTimeout(tick, 0);

    return {
        messages: messages,
        await: function (fn) {
            done = fn;
            if (!timer) {
                timer = setTimeout(tick, 0);
            }
        },
        dump: function (array) {
            console.log(
                (array || messages)
                    .map((x) =>
                        JSON.stringify(x)
                            .replace(/"([^"*]+)":/g, '$1: ')
                            .replace(/("\*"):/g, '$1: ')
                            .replace(/"/g, "'")
                            .replace(/([,{])/g, '$1 ')
                            .replace(/}/g, ' }')
                    )
                    .join(',\n')
            );
        },
        destroy: function () {
            clearTimeout(timer);
            listeners = null;
            queue = null;
            messages = null;
            delete global.postMessage;
            delete global.addEventListener;
        },
    };
}

export { EventTransport, createScope };
