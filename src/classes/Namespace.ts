import { AnyFn } from '../utils/index.js';
import Endpoint, { CallPacket, Packet } from './Endpoint.js';

export type Method<T extends unknown[]> = (...args: T) => unknown;
export type MethodsMap = Record<string, Method<unknown[]>>;
export type Wrapper = ((...args: unknown[]) => Promise<unknown>) & { available: boolean };
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

            for (const [methodName, fn] of Object.entries(methods)) {
                if (typeof fn === 'function') {
                    this.methods[methodName] = fn;
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

    callRemote(method: string, ...args: unknown[]): Promise<unknown> {
        let callback: AnyFn | null = null;

        if (args.length && typeof args[args.length - 1] === 'function') {
            callback = args.pop() as AnyFn;
            console.warn(
                '[rempl] Using a callback for Namespace#callMethod() is deprecated, use returned promise value instead'
            );
        }

        const callPacket: CallPacket = {
            type: 'call',
            ns: this.name,
            method,
            args,
        };

        return new Promise((resolve) => {
            Namespace.send(this.owner, [
                callPacket,
                (...args: unknown[]) => {
                    resolve(args[0]);
                    callback?.(...args);
                },
            ]);
        });
    }

    getRemoteMethod(methodName: string): Wrapper {
        let methodWrapper = this.remoteMethodWrappers[methodName];

        if (typeof methodWrapper !== 'function') {
            methodWrapper = this.remoteMethodWrappers[methodName] = Object.assign(
                (...args: unknown[]) => {
                    if (methodWrapper.available) {
                        return this.callRemote(methodName, ...args);
                    }

                    return Promise.reject(
                        new Error(
                            `[rempl] ${this.owner.getName()} ns("${
                                this.name
                            }") has no available remote method "${methodName}`
                        )
                    );
                },
                {
                    available: this.remoteMethods.indexOf(methodName) !== -1,
                }
            );
        }

        return methodWrapper;
    }

    onRemoteMethodsChanged(callback: ListenerCallback): AnyFn {
        const listener: Listener = {
            event: 'remoteMethodsChanged',
            callback,
            listeners: this.listeners,
        };

        this.listeners = listener;

        callback([...this.remoteMethods]);

        return () => {
            let cursor = this.listeners;
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
        let callbackCalled = false;
        args = args.concat((...args: unknown[]) => {
            callbackCalled = true;
            callback(...args);
            console.warn(
                '[rempl] Using a callback in provided methods has been deprecated, just return a value or promise instead'
            );
        });

        // invoke the provided remote method
        Promise.resolve(namespace.methods[method].apply(null, args)).then((value) => {
            if (!callbackCalled) {
                callback(value);
            }
        });
    }

    static notifyRemoteMethodsChanged(namespace: Namespace): void {
        let cursor = namespace.listeners;

        for (const method in namespace.remoteMethodWrappers) {
            namespace.remoteMethodWrappers[method].available =
                namespace.remoteMethods.includes(method);
        }

        while (cursor !== null) {
            if (cursor.event === 'remoteMethodsChanged') {
                cursor.callback.call(null, [...namespace.remoteMethods]);
            }

            cursor = cursor.listeners;
        }
    }

    static send(
        owner: Endpoint<Namespace>,
        args: [Packet, (((...args: unknown[]) => void) | null)?]
    ): void {
        for (const { send } of owner.channels) {
            send(...args);
        }
    }
}
