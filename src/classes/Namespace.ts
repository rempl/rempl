import { AnyFn, Fn, hasOwnProperty } from '../utils';
import Endpoint, { CallPacket, Packet } from './Endpoint';

export type Method<TArgs extends unknown[]> = Fn<TArgs, unknown>;
export type MethodsMap = Record<string, Method<unknown[]>>;
export type Wrapper = Fn<unknown[], void, Namespace> & { available: boolean };
export type ListenerCallback = (methods: string[]) => void;
export type Listener = {
    event: string;
    callback: ListenerCallback;
    listeners: Listener | null;
};

export default class Namespace {
    name: string;
    owner: Endpoint<Namespace>;
    methods: MethodsMap = Object.create(null);
    remoteMethodWrappers: Record<string, Wrapper> = Object.create(null);
    remoteMethods: string[] = [];
    listeners: Listener | null = null;

    constructor(name: string, owner: Endpoint<Namespace>) {
        this.name = name;
        this.owner = owner;
        this.methods = Object.create(null);
    }

    isMethodProvided(methodName: string): boolean {
        return methodName in this.methods;
    }

    provide<TReturn extends unknown[]>(
        methodName: string | MethodsMap,
        fn?: Method<TReturn>
    ): void {
        if (typeof methodName === 'string') {
            if (typeof fn === 'function') {
                this.methods[methodName] = fn as Method<unknown[]>;
                this.owner.scheduleProvidedMethodsUpdate();
            }
        } else {
            const methods = methodName;
            for (methodName in methods) {
                if (
                    hasOwnProperty(methods, methodName) &&
                    typeof methods[methodName] === 'function'
                ) {
                    this.methods[methodName] = methods[methodName];
                    this.owner.scheduleProvidedMethodsUpdate();
                }
            }
        }
    }

    revoke(methodName: string | string[]): void {
        if (Array.isArray(methodName)) {
            methodName.forEach(this.revoke, this);
        } else {
            if (this.isMethodProvided(methodName)) {
                delete this.methods[methodName];
                this.owner.scheduleProvidedMethodsUpdate();
            }
        }
    }

    isRemoteMethodExists(methodName: string): boolean {
        return this.remoteMethods.includes(methodName);
    }

    callRemote(method: string, ...args: unknown[]): void {
        let callback: AnyFn | null = null;

        if (args.length && typeof args[args.length - 1] === 'function') {
            callback = args.pop() as AnyFn;
        }

        const callPacket: CallPacket = {
            type: 'call',
            ns: this.name,
            method: method,
            args: args,
        };

        Namespace.send(this.owner, [callPacket, callback]);
    }

    getRemoteMethod(methodName: string): Wrapper {
        let methodWrapper = this.remoteMethodWrappers[methodName];

        if (typeof methodWrapper !== 'function') {
            methodWrapper = this.remoteMethodWrappers[methodName] = ((...args: unknown[]) => {
                if (methodWrapper.available) {
                    this.callRemote(methodName, ...args);
                } else {
                    console.warn(
                        '[rempl] ' +
                            this.owner.getName() +
                            ' ns(' +
                            this.name +
                            ') has no available remote method `' +
                            methodName +
                            '`'
                    );
                }
            }) as Wrapper;
            methodWrapper.available = this.remoteMethods.indexOf(methodName) !== -1;
        }

        return methodWrapper;
    }

    onRemoteMethodsChanged(callback: ListenerCallback): AnyFn {
        const listener: Listener = {
            event: 'remoteMethodsChanged',
            callback: callback,
            listeners: this.listeners,
        };

        this.listeners = listener;

        callback([...this.remoteMethods]);

        return () => {
            let cursor = this.listeners;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            let prev: { listeners: Listener | null } = this;

            while (cursor !== null) {
                if (cursor === listener) {
                    prev.listeners = cursor.listeners;
                    break;
                }

                prev = cursor;
                cursor = cursor.listeners;
            }
        };
    }

    static invoke(namespace: Namespace, method: string, args: unknown[], callback: AnyFn): void {
        // add a callback to args even if no callback, to avoid extra checking
        // that callback is passed by remote side
        args = args.concat(typeof callback === 'function' ? callback : () => {});

        // invoke the provided remote method
        namespace.methods[method].apply(null, args);
    }

    static notifyRemoteMethodsChanged(namespace: Namespace): void {
        let cursor = namespace.listeners;

        for (const method in namespace.remoteMethodWrappers) {
            namespace.remoteMethodWrappers[method].available =
                namespace.remoteMethods.indexOf(method) !== -1;
        }

        while (cursor !== null) {
            if (cursor.event === 'remoteMethodsChanged') {
                cursor.callback.call(null, namespace.remoteMethods.slice());
            }
            cursor = cursor.listeners;
        }
    }

    static send(
        owner: Endpoint<Namespace>,
        args: [Packet, (((...args: unknown[]) => void) | null)?]
    ): void {
        owner.channels.forEach((channel) => {
            channel.send.apply(null, args);
        });
    }
}
