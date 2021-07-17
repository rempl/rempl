import { Namespace } from './Namespace.js';
import { Token } from './Token.js';
import { EndpointListSet } from './EndpointListSet.js';
import { warn } from '../utils/index.js';

type Channel = {
    type: string;
    send: Function;
}
type RemoteAPI = {
    [key: string]: string[];
};

export class Endpoint<NamespaceClass extends Namespace = Namespace> {
    id: string | null;
    namespaces: {
        [key: string]: NamespaceClass
    };
    channels: Channel[];
    connected: Token<boolean>;
    remoteEndpoints: EndpointListSet<this>;
    providedMethodsUpdateTimer: ReturnType<typeof setTimeout>;
    // [Property in keyof NamespaceClass]: Function;

    get type() {
        return 'Endpoint';
    }

    get namespaceClass() {
        return Namespace;
    }

    constructor(id?: string) {
        this.id = id || null;
        this.namespaces = Object.create(null);

        this.processInput = this.processInput.bind(this);
        this.channels = [];
        this.connected = new Token<boolean>(false);
        this.remoteEndpoints = new EndpointListSet<this>();
        this.remoteEndpoints.on(endpoints => {
            // Star is used as a hack for subscriber<->sandbox communication
            // TODO: find a better solution
            this.connected.set(endpoints.some(p => p.id === this.id || p.id === '*'));
        });

        let defaultNS = this.ns('*');
        for (let methodName in defaultNS) {
            const value = defaultNS[methodName];

            if (typeof value === 'function') {
                this[methodName] = value.bind(defaultNS);
            }
        }
    }

    getName() {
        const id = this.id ? `#${this.id}` : '';

        return `${this.type}${id}`;
    }

    ns(name) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = new this.namespaceClass(name, this);
        }

        return this.namespaces[name];
    }

    requestRemoteApi() {
        const payload = {
            type: 'getProvidedMethods',
            methods: this.getProvidedApi()
        };
        const callback = methods => this.setRemoteApi(methods);

        Namespace.send(this, [payload, callback]);
    }

    setRemoteApi(api?: RemoteAPI) {
        const changed = [];

        if (!api) {
            api = {};
        }

        for (const name in api) {
            if (Array.isArray(api[name])) {
                const ns = this.ns(name);
                const methods = api[name].slice().sort();
                const different =
                    ns.remoteMethods.length !== methods.length ||
                    ns.remoteMethods.some((value, idx) => value !== methods[idx]);

                if (different) {
                    ns.remoteMethods = methods;
                    changed.push(ns);
                }
            }
        }

        for (const name in this.namespaces) {
            if (Array.isArray(api[name]) === false) {
                const ns = this.namespaces[name];

                ns.remoteMethods = [];
                changed.push(ns);
            }
        }

        changed.forEach(ns =>
            Namespace.notifyRemoteMethodsChanged(ns)
        );
    }

    getProvidedApi() {
        const api = Object.create(null);

        for (const name in this.namespaces) {
            api[name] = Object.keys(this.namespaces[name].methods).sort();
        }

        return api;
    }

    scheduleProvidedMethodsUpdate() {
        if (!this.providedMethodsUpdateTimer) {
            this.providedMethodsUpdateTimer = setTimeout(() => {
                this.providedMethodsUpdateTimer = null;

                const payload = {
                    type: 'remoteMethods',
                    methods: this.getProvidedApi()
                };

                Namespace.send(this, [payload]);
            }, 0);
        }
    }

    processInput(packet, callback) {
        switch (packet.type) {
            case 'call':
                const ns = this.ns(packet.ns || '*');

                if (!ns.isMethodProvided(packet.method)) {
                    return warn(`[rempl][sync] ${this.getName()} (namespace: ${packet.ns || 'default'}) has no remote method:`, packet.method);
                }

                Namespace.invoke(ns, packet.method, packet.args, callback);
                break;

            case 'remoteMethods':
                this.setRemoteApi(packet.methods);
                break;

            case 'getProvidedMethods':
                callback(this.getProvidedApi());
                break;

            default:
                warn(`[rempl][sync] ${this.getName()} Unknown packet type:`, packet.type);
        }
    }

    setupChannel(type, send, remoteEndpoints, available) {
        if (available) {
            this.channels.push({
                type: type,
                send: send
            });

            // Note that endpoints should be changed after channels is changed,
            // since it may change this.connected that can send something to remote side
            // when connection is established
            this.remoteEndpoints.add(remoteEndpoints);
        } else {
            for (let i = 0; i < this.channels.length; i++) {
                if (this.channels[i].type === type &&
                    this.channels[i].send === send) {
                    this.remoteEndpoints.remove(remoteEndpoints);
                    this.channels.splice(i, 1);
                    break;
                }
            }
        }
    }
}
