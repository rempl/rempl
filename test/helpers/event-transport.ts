import OriginalEventTransport from '../../src/transport/event.js';
import { globalThis } from '../../src/utils/global.js';

globalThis.addEventListener = () => {};

function createScope() {
    class EventTransport extends OriginalEventTransport {
        constructor(from: string, to: string) {
            super(from, to, realm);

            transports.push(this);
            replaceId.set(this, transports.filter((t) => t.name === from).length); // ???
        }
    }

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
        clearTimeout(timer);

        if (queue.length === 0) {
            const offset = start;

            start = messages.length;
            timer = null;

            done(processMessages(messages.slice(offset)));
        } else {
            const message = queue.shift();

            for (const transport of transports) {
                transport._onMessage(message);
            }

            timer = setTimeout(tick, 0);
        }
    }

    const transports = [];
    const callbacks = [];
    const replaceId = new WeakMap<OriginalEventTransport, number>();
    let queue = [];
    let messages = [];
    let timer = null;
    let done = null;
    let start = 0;

    const realm = {
        postMessage(data, origin) {
            const message = {
                source: realm,
                target: globalThis,
                origin,
                data,
            };

            messages.push(message);
            queue.push(message);
        },
    };

    // timer = setTimeout(tick, 0);

    return {
        EventTransport,
        messages,
        await(fn) {
            done = fn;
            if (!timer) {
                timer = setTimeout(tick, 0);
            }
        },
        dump(array) {
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
        destroy() {
            clearTimeout(timer);
            queue = null;
            messages = null;
        },
    };
}

export { createScope };
