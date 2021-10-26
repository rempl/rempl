/* eslint-env browser */
import EventTransport from '../transport/event';
import Subscriber from '../classes/Subscriber';

const subscribers = new Map<string, Subscriber>();

export default function getEnv(id: string): Subscriber {
    let subscriber = subscribers.get(id);

    if (!subscriber) {
        subscribers.set(id, (subscriber = new Subscriber(id)));
        EventTransport.get('rempl-env-subscriber', 'rempl-env-publisher', parent).sync(subscriber);
    }

    return subscriber;
}
