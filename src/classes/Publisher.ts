import Namespace from './Namespace.js';
import Endpoint from './Endpoint.js';

export type PipeFn = (...args: unknown[]) => unknown;

export class PublisherNamespace extends Namespace {
    _lastData: unknown = null;

    constructor(name: string, owner: Endpoint<Namespace>) {
        super(name, owner);

        this.provide('init', () => this._lastData);
    }

    publish(payload: unknown): void {
        this._lastData = payload;
        Namespace.send(this.owner, [
            {
                type: 'data',
                ns: this.name,
                payload,
            },
        ]);
    }
}

export class Publisher extends Endpoint<PublisherNamespace> {
    type = 'Publisher';
    get namespaceClass() {
        return PublisherNamespace;
    }
}
