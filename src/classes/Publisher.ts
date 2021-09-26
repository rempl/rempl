import Namespace from '../classes/Namespace';
import Endpoint from '../classes/Endpoint';

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
                payload: payload,
            },
        ]);
    }

    pipe(fn: PipeFn, init?: unknown): PipeFn {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const publisher = this;
        const pipe = function (this: unknown, ...args: unknown[]) {
            publisher.publish(fn.apply(this, args));
        };

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
    namespaceClass = PublisherNamespace;
    type = 'Publisher';
}
