/* eslint-env browser */
import EventTransport, { OnInitCallback } from '../../transport/event.js';
import { genUID } from '../../utils/index.js';
import { globalThis, parent } from '../../utils/global.js';

type Global = typeof globalThis;
type Sandbox = Window | Global;
type Settings =
    | {
          type: 'script';
          content: Record<string, string>;
          window?: Window;
          container?: HTMLElement;
      }
    | {
          type: 'url';
          content: string;
          window?: Window;
          container?: HTMLElement;
      };

const initEnvSubscriberMessage = new WeakMap();

// TODO: make tree-shaking friendly
if (parent !== globalThis) {
    addEventListener('message', function (event: MessageEvent<any>) {
        const data = event.data || {};

        if (event.source && data.to === 'rempl-env-publisher:connect') {
            initEnvSubscriberMessage.set(event.source, data);
        }
    });
}

export default function createSandbox(settings: Settings, callback: OnInitCallback) {
    function initSandbox(sandboxWindow: Sandbox) {
        if (settings.type === 'script') {
            for (const name in settings.content) {
                (sandboxWindow as Global).eval(settings.content[name] + '\n//# sourceURL=' + name);
            }
        }

        if (parent !== globalThis && sandboxWindow !== globalThis) {
            let toSandbox = NaN;
            let toEnv = NaN;

            if (onEnvMessage) {
                removeEventListener('message', onEnvMessage, true);
                onEnvMessage = null;
            }

            addEventListener(
                'message',
                (onEnvMessage = function (event: MessageEvent<any>) {
                    const data = event.data || {};

                    switch (data.to) {
                        case 'rempl-env-subscriber:connect':
                        case toSandbox:
                            toEnv = data.from;
                            sandboxWindow.postMessage(data);
                            break;

                        case 'rempl-env-publisher:connect':
                        case toEnv:
                            toSandbox = data.from;
                            parent.postMessage(data);
                            break;
                    }
                }),
                true
            );

            if (settings.type !== 'script') {
                const initMessage = initEnvSubscriberMessage.get(sandboxWindow);

                if (initMessage) {
                    toSandbox = initMessage.from;
                    parent.postMessage(initMessage);
                }
            }
        }

        // sandbox <-> subscriber transport
        // TODO: teardown transport
        transport = EventTransport.get('rempl-sandbox', 'rempl-subscriber', sandboxWindow).onInit(
            {},
            (api) => callback(api)
        );

        if (connected) {
            transport.ownEndpoints.set(['*']);
        }
    }

    let iframe: HTMLIFrameElement | null = null;
    let onEnvMessage: ((event: MessageEvent<any>) => void) | null = null;
    let transport: EventTransport | null = null;
    let connected = false;

    settings = settings || {};

    if (settings.window) {
        initSandbox(settings.window);
    } else {
        iframe = document.createElement('iframe');
        iframe.name = genUID(); // to avoid cache
        iframe.onload = () => iframe?.contentWindow && initSandbox(iframe.contentWindow);

        if (settings.type === 'url') {
            iframe.src = settings.content;
        } else {
            iframe.srcdoc = '<!doctype html>';
        }

        (settings.container || document.documentElement).appendChild(iframe);
    }

    return {
        setConnected(state: boolean) {
            connected = state;

            if (transport) {
                transport.ownEndpoints.set(connected ? ['*'] : []);
            }
        },
        destroy() {
            if (onEnvMessage) {
                removeEventListener('message', onEnvMessage, true);
                onEnvMessage = null;
            }

            if (transport) {
                transport.ownEndpoints.set([]);
            }

            if (iframe !== null) {
                iframe.remove();
                iframe.setAttribute('srcdoc', '');
                iframe.setAttribute('src', '');
                iframe = null;
            }
        },
    };
}
