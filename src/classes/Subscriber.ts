import Namespace from '../classes/Namespace';
import Endpoint, { Packet } from '../classes/Endpoint';
import * as utils from '../utils/';
import { AnyFn, Unsubscribe } from '../utils/';

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

    subscribe(fn: AnyFn): Unsubscribe {
        this.callRemote('init', fn);
        return utils.subscribe(this.subscribers, fn);
    }
}

export default class Subscriber extends Endpoint<SubscriberNamespace> {
    namespaceClass = SubscriberNamespace;
    type = 'Subscriber';

    constructor(id?: string) {
        super(id);

        this.connected.on((connected) => {
            if (connected) {
                this.requestRemoteApi();
                for (const name in this.namespaces) {
                    const ns = this.namespaces[name] as SubscriberNamespace;
                    if (ns.subscribers.length) {
                        ns.callRemote(
                            'init',
                            function (this: typeof ns, data: unknown) {
                                this.subscribers.forEach(function (callback) {
                                    callback(data);
                                });
                            }.bind(ns)
                        );
                    }
                }
            } else {
                this.setRemoteApi();
            }
        }, this);
    }

    processInput = (packet: Packet, callback: AnyFn): void => {
        switch (packet.type) {
            case 'data': {
                const thePacket = packet as DataPacket;
                this.ns(thePacket.ns || '*')
                    .subscribers.slice()
                    .forEach(function (callback) {
                        callback(thePacket.payload);
                    });
                break;
            }

            default:
                Endpoint.prototype.processInput.call(this, packet, callback);
        }
    };
}
