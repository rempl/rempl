import {
    CallMessage,
    RemoteMethodsMessage,
    GetProvidedMethodsMessage,
    MethodsMap,
} from '../types.js';
import { AnyFn } from '../utils/index.js';
import { Namespace } from './Namespace.js';
import { ReactiveValue } from './ReactiveValue.js';
import { EndpointListSet } from './EndpointListSet.js';
import { EndpointList } from './EndpointList.js';

export type Channel = {
    type: string;
    send: AnyFn;
};

export type Packet = CallMessage | RemoteMethodsMessage | GetProvidedMethodsMessage;

export class Endpoint<TNamespace extends Namespace> {
    id: string | null;
    namespaces: {
        [key: string]: TNamespace;
    };
    get namespaceClass() {
        return Namespace;
    }
    type = 'Endpoint';
    channels: Channel[] = [];
    connected = new ReactiveValue(false);
    remoteEndpoints = new EndpointListSet();

    providedMethodsUpdateTimer?: number | NodeJS.Timeout | null;

    constructor(id?: string) {
        this.id = id || null;
        this.namespaces = Object.create(null);

        this.remoteEndpoints.on((endpoints) => {
            // Star is used as a hack for subscriber<->sandbox communication
            // TODO: find a better solution
            this.connected.set(endpoints.includes(this.id || '*'));
        }, this);

        // TODO: rework
        // const defaultNS = this.ns('*');
        // const methodNames: (keyof TNamespace)[] = [];

        // for (
        //     let cursor = defaultNS;
        //     cursor && cursor != Object.prototype;
        //     cursor = Object.getPrototypeOf(cursor)
        // ) {
        //     methodNames.push(...(Object.getOwnPropertyNames(cursor) as (keyof TNamespace)[]));
        // }

        // for (const method of methodNames) {
        //     // todo rework in the next version
        //     if (typeof defaultNS[method] === 'function') {
        //         // @ts-ignore
        //         this[method] = defaultNS[method].bind(defaultNS);
        //     }
        // }
    }

    getName() {
        return this.type + (this.id ? '#' + this.id : '');
    }

    ns<K extends string>(name: K) {
        let namespace = this.namespaces[name];

        if (!namespace) {
            namespace = Object.assign(new this.namespaceClass(name, this) as TNamespace);
            this.namespaces[name] = namespace;
        }

        return namespace;
    }

    send<T = Packet>(packet: T, callback: ((...args: unknown[]) => void) | null = null): void {
        for (const { send } of this.channels) {
            send(packet, callback);
        }
    }

    requestRemoteApi() {
        this.send({ type: 'getProvidedMethods' } as const, (methods) => {
            this.setRemoteApi(methods as MethodsMap);
        });
    }

    setRemoteApi(api?: MethodsMap) {
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
                    ns.remoteMethods.some(function (value, idx) {
                        return value !== methods[idx];
                    });

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

        changed.forEach((ns) => Namespace.notifyRemoteMethodsChanged(ns));
    }

    getProvidedApi() {
        const api: MethodsMap = Object.create(null);

        for (const name in this.namespaces) {
            api[name] = Object.keys(this.namespaces[name].methods).sort();
        }

        return api;
    }

    scheduleProvidedMethodsUpdate() {
        if (!this.providedMethodsUpdateTimer) {
            this.providedMethodsUpdateTimer = setTimeout(() => {
                this.providedMethodsUpdateTimer = null;
                this.send({
                    type: 'remoteMethods',
                    methods: this.getProvidedApi(),
                });
            }, 0);
        }
    }

    processInput(packet: Packet, callback: AnyFn) {
        switch (packet.type) {
            case 'call': {
                const thePacket = packet;
                const ns = this.ns(thePacket.ns || '*');

                if (!ns.isMethodProvided(thePacket.method)) {
                    return console.warn(
                        `[rempl][sync] ${this.getName()} (namespace: ${
                            thePacket.ns || 'default'
                        }) has no remote method:`,
                        thePacket.method
                    );
                }

                Namespace.invoke(ns, thePacket.method, thePacket.args, callback);
                break;
            }

            case 'remoteMethods': {
                const thePacket = packet;
                this.setRemoteApi(thePacket.methods);
                break;
            }

            case 'getProvidedMethods':
                callback(this.getProvidedApi());
                break;

            default:
                console.warn(
                    '[rempl][sync] ' + this.getName() + 'Unknown packet type:',
                    // @ts-ignore
                    packet.type
                );
        }
    }

    setupChannel(type: string, send: AnyFn, remoteEndpoints: EndpointList, available: boolean) {
        if (available) {
            this.channels.push({
                type,
                send,
            });
            // Note that endpoints should be changed after channels is changed,
            // since it may change this.connected that can send something to remote side
            // when connection is established
            this.remoteEndpoints.add(remoteEndpoints);
        } else {
            for (let i = 0; i < this.channels.length; i++) {
                if (this.channels[i].type === type && this.channels[i].send === send) {
                    this.remoteEndpoints.remove(remoteEndpoints);
                    this.channels.splice(i, 1);
                    break;
                }
            }
        }
    }
}
