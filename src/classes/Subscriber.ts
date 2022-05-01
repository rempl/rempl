import Namespace from './Namespace.js';
import Endpoint, { Packet } from './Endpoint.js';
import { AnyFn, subscribe } from '../utils/index.js';

export type DataPacket = {
    type: string;
    ns?: string;
    payload: unknown;
};

const subscribers = new Map<SubscriberNamespace, AnyFn[]>();

export class SubscriberNamespace extends Namespace {
    constructor(name: string, endpoint: Endpoint<SubscriberNamespace>) {
        super(name, endpoint);
        subscribers.set(this, []);
    }

    subscribe(fn: AnyFn) {
        this.callRemote('init', fn);

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
                        ns.callRemote('init', (data: unknown) => {
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

    processInput = (packet: Packet, callback: AnyFn) => {
        switch (packet.type) {
            case 'data': {
                const { ns, payload } = packet as DataPacket;
                const nsSubscribers = subscribers.get(this.ns(ns || '*'));

                if (nsSubscribers) {
                    nsSubscribers.slice().forEach((callback) => callback(payload));
                }
                break;
            }

            default:
                super.processInput(packet, callback);
        }
    };
}
