import { Namespace } from '../classes/Namespace.js';
import { Endpoint } from '../classes/Endpoint.js';

class PublisherNamespace extends Namespace {
    _lastData: any;

    constructor(name, owner) {
        super(name, owner);
        this._lastData = null;

        this.provide('init', callback => callback(this._lastData));
    }

    publish(payload) {
        this._lastData = payload;
        Namespace.send(this.owner, [{
            type: 'data',
            ns: this.name,
            payload
        }]);
    }

    pipe(fn, init = true) {
        const pipe = (...args) =>
            this.publish(fn.apply(this, args));

        if (!fn) {
            init = false;
            fn = value => value;
        }

        if (init) {
            pipe(); // ??? args?
        }

        return pipe;
    }
}

export class Publisher extends Endpoint {
    get type() {
        return 'Publisher';
    }

    get namespaceClass() {
        return PublisherNamespace;
    }
}
