import EventTransport from '../transport/event';
import Publisher from '../classes/Publisher';

class EnvPublisher extends Publisher {
    linkWindow(target: Window | typeof global) {
        EventTransport.get('rempl-env-publisher', 'rempl-env-subscriber', target).sync(this);
    }
}

export default function createEnv(id?: string) {
    return new EnvPublisher(id);
}
