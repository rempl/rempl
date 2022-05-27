import { Namespace } from './Namespace.js';
import { Endpoint } from './Endpoint.js';
import { SubscriberPacket } from './Subscriber.js';

export type PipeFn = (...args: unknown[]) => unknown;

export class PublisherNamespace extends Namespace {
    _lastData: unknown = null;
    publish: (payload: unknown) => void;

    constructor(name: string, owner: Publisher) {
        super(name, owner);

        this.provide('init', () => this._lastData);
        this.publish = (payload: unknown) => {
            this._lastData = payload;
            owner.send<SubscriberPacket>({
                type: 'data',
                ns: this.name,
                payload,
            });
        };
    }
}

export class Publisher extends Endpoint<PublisherNamespace> {
    type = 'Publisher';
    get namespaceClass() {
        return PublisherNamespace;
    }
}
