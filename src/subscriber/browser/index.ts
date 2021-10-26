/* eslint-env browser */
import Subscriber from '../../classes/Subscriber.js';
import EventTransport from '../../transport/event.js';
import setOverlayVisible from './disconnected-overlay.js';

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

export default function () {
    if (subscriber === null) {
        subscriber = createSubscriber();
    }

    return subscriber;
}
