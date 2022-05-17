/* eslint-env browser */
import { globalThis, parent } from '../../utils/global.js';
import EventTransport from '../../transport/event.js';
import { Publisher } from '../../classes/Publisher.js';
import { Subscriber } from '../../classes/Subscriber.js';

const subscribers = new Map<string, Subscriber>();

class EnvPublisher extends Publisher {
    linkWindow(target: Window | typeof globalThis) {
        EventTransport.get('rempl-env-publisher', 'rempl-env-subscriber', target).sync(this);
    }
}

export function getEnv(id: string): Subscriber {
    let subscriber = subscribers.get(id);

    if (!subscriber) {
        subscribers.set(id, (subscriber = new Subscriber(id)));
        EventTransport.get('rempl-env-subscriber', 'rempl-env-publisher', parent).sync(subscriber);
    }

    return subscriber;
}

export function createEnv(id?: string) {
    return new EnvPublisher(id);
}
