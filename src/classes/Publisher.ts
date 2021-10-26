import Namespace from './Namespace';
import Endpoint from './Endpoint';

export type PipeFn = (...args: unknown[]) => unknown;

export class PublisherNamespace extends Namespace {
    _lastData: unknown = null;

    constructor(name: string, owner: Endpoint<Namespace>) {
        super(name, owner);

        this.provide('init', (callback: (data: unknown) => void) => {
            callback(this._lastData);
        });
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

    pipe(fn: PipeFn, init?: unknown): PipeFn {
        const pipe = (...args: unknown[]) => this.publish(fn(...args));

        if (!fn) {
            init = false;
            fn = (value: unknown) => value;
        }

        if (init || init === undefined) {
            pipe();
        }

        return pipe;
    }
}

export default class Publisher extends Endpoint<PublisherNamespace> {
    type = 'Publisher';
    get namespaceClass() {
        return PublisherNamespace;
    }
}
