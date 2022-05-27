import { DataMessage } from '../types.js';
import { AnyFn, subscribe } from '../utils/index.js';
import { Namespace } from './Namespace.js';
import { Packet, Endpoint } from './Endpoint.js';

export type SubscriberPacket = DataMessage | Packet;

const subscribers = new Map<SubscriberNamespace, AnyFn[]>();

export class SubscriberNamespace extends Namespace {
    constructor(name: string, endpoint: Endpoint<SubscriberNamespace>) {
        super(name, endpoint);
        subscribers.set(this, []);
    }

    subscribe(fn: AnyFn) {
        this.callRemote('init').then(fn);

        return subscribe(subscribers.get(this) || [], fn);
    }
}

export class Subscriber extends Endpoint<SubscriberNamespace> {
    type = 'Subscriber';
    get namespaceClass() {
        return SubscriberNamespace;
    }

    constructor(id?: string) {
        super(id);

        this.connected.on((connected) => {
            if (connected) {
                this.requestRemoteApi();

                for (const name in this.namespaces) {
                    const ns = this.namespaces[name];
                    const nsSubscribers = subscribers.get(ns) || [];

                    if (nsSubscribers.length) {
                        ns.callRemote('init').then((data: unknown) => {
                            for (const callback of nsSubscribers) {
                                callback(data);
                            }
                        });
                    }
                }
            } else {
                this.setRemoteApi();
            }
        });
    }

    processInput(packet: SubscriberPacket, callback: AnyFn) {
        switch (packet.type) {
            case 'data': {
                const { ns, payload } = packet;
                const nsSubscribers = subscribers.get(this.ns(ns || '*'));

                if (nsSubscribers) {
                    nsSubscribers.slice().forEach((callback) => callback(payload));
                }
                break;
            }

            default:
                super.processInput(packet as Packet, callback); // FIXME!!!
        }
    }
}
