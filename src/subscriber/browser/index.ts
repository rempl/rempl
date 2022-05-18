/* eslint-env browser */
import { opener, parent } from '../../utils/global.js';
import { Subscriber } from '../../classes/Subscriber.js';
import EventTransport from '../../transport/event.js';
import { setOverlayVisible } from './disconnected-overlay/index.js';

let subscriber: Subscriber | null = null;

function createSubscriber() {
    subscriber = new Subscriber();

    // default overlay
    const connectedObservable = Object.assign(subscriber.connected, { defaultOverlay: true });
    connectedObservable.link((connected) => {
        if (connected) {
            setOverlayVisible(false);
        } else if (connectedObservable.defaultOverlay) {
            setOverlayVisible(true);
        }
    });

    // link to transport
    EventTransport.get('rempl-subscriber', 'rempl-sandbox', opener || parent).sync(subscriber);

    return subscriber;
}

export function getSubscriber() {
    if (subscriber === null) {
        subscriber = createSubscriber();
    }

    return subscriber;
}

export function getSelfSubscriber(id: string) {
    const subscriber = new Subscriber(id);

    EventTransport.get('rempl-self-subscriber', 'rempl-self-publisher').sync(subscriber);

    return subscriber;
}
