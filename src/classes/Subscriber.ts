import Namespace from './Namespace';
import Endpoint, { Packet } from './Endpoint';
import * as utils from '../utils/';
import { AnyFn } from '../utils/';

export type DataPacket = {
    type: string;
    ns?: string;
    payload: unknown;
};

export class SubscriberNamespace extends Namespace {
    subscribers: AnyFn[] = [];

    constructor(name: string, owner: Endpoint<Namespace>) {
        super(name, owner);
    }

    subscribe(fn: AnyFn) {
        this.callRemote('init', fn);

        return utils.subscribe(this.subscribers, fn);
    }
}

export default class Subscriber extends Endpoint<SubscriberNamespace> {
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

                    if (ns.subscribers.length) {
                        ns.callRemote('init', (data: unknown) => {
                            for (const callback of ns.subscribers) {
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

                this.ns(ns || '*')
                    .subscribers.slice()
                    .forEach((callback) => callback(payload));
                break;
            }

            default:
                Endpoint.prototype.processInput.call(this, packet, callback);
        }
    };
}
