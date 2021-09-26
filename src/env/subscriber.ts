/* eslint-env browser */
import EventTransport from '../transport/event';
import Subscriber from '../classes/Subscriber';

const env: Record<string, Subscriber> = Object.create(null);

export default function getEnv(id: string): Subscriber {
    if (!(id in env)) {
        env[id] = new Subscriber(id);
        EventTransport.get('rempl-env-subscriber', 'rempl-env-publisher', parent).sync(env[id]);
    }

    return env[id];
}
