/* eslint-env browser */

import { globalThis } from '../../../utils/global.js';
import __CSS__ from './style.js';

type StopIdentifyMessage = { op: 'stop-identify' };
type AddPublisherMessage = { op: 'add-publisher'; id: string; name: string };
type Message = StopIdentifyMessage | AddPublisherMessage;

const identifyWidgetId = 'rempl-identify-widget';
let cancelOverlay: (() => void) | null = null;

function createOverlay(origin: string, num: string) {
    const overlayEl = document.createElement('div');
    const shadow = overlayEl.attachShadow({ mode: 'closed' });
    const styleEl = document.createElement('style');
    const buttonsEl = document.createElement('div');
    const headerEl = document.createElement('h1');

    overlayEl.id = identifyWidgetId;
    overlayEl.dataset.origin = origin;
    headerEl.textContent = num;
    styleEl.textContent = __CSS__;

    shadow.append(styleEl, headerEl, buttonsEl);

    return {
        overlayEl,
        createButton(name: string, pickPublisher: () => void) {
            const wrapperEl = buttonsEl.appendChild(document.createElement('div'));
            const buttonEl = wrapperEl.appendChild(document.createElement('button'));

            wrapperEl.setAttribute('style', 'margin-bottom:5px');

            buttonEl.textContent = name;
            buttonEl.addEventListener('click', pickPublisher);
        },
    };
}

export function postIdentifyMessage(params: Message) {
    globalThis.postMessage({ to: identifyWidgetId, ...params });
}

export function startIdentify(
    origin: string,
    num: number | string,
    callback: (publisherId: string) => void
) {
    const existingWidget = document.querySelector('#' + identifyWidgetId);

    if (!existingWidget || (existingWidget as HTMLElement).dataset.origin !== origin) {
        if (existingWidget) {
            postMessage({ op: 'stop-identify' });
        }

        const { overlayEl, createButton } = createOverlay(origin, String(num));

        const documentStyleOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.appendChild(overlayEl);

        const onMessageCallback = (
            event: MessageEvent<Message & { to: typeof identifyWidgetId }>
        ) => {
            const { data } = event;

            if (data?.to === identifyWidgetId) {
                switch (data.op) {
                    case 'add-publisher':
                        createButton(data.name || data.id, () => callback(data.id));
                        break;

                    case 'stop-identify':
                        console.log('stop-indentify');
                        cancelOverlay?.();
                        break;
                }
            }
        };

        addEventListener('message', onMessageCallback);

        cancelOverlay = () => {
            removeEventListener('message', onMessageCallback);
            document.body.style.overflow = documentStyleOverflow;
            overlayEl.remove();
            cancelOverlay = null;
        };
    }
}

export function stopIdentify() {
    if (typeof cancelOverlay === 'function') {
        cancelOverlay();
    }
}
