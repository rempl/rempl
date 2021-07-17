import { Endpoint } from './Endpoint.js';
const hasOwnProperty = Object.prototype.hasOwnProperty;
const noop = function() {};

type Method = Function;
type MethodMap = {
    [key: string]: Method
};
type MethodWrapperMap = {
    [key: string]: Method & { available?: boolean }
};
type EventListener = {
    event: string;
    callback: () => void;
    listeners: EventListener;
}

export class Namespace {
    name: string;
    owner: Endpoint;
    methods: MethodMap;
    remoteMethods: string[];
    remoteMethodWrappers: MethodWrapperMap;
    listeners: EventListener;

    static send(owner: Endpoint, args: any[]) {
        for (let { send } of owner.channels) {
            send(...args);
        }
    }

    static invoke(namespace: Namespace, method: string, args: any[], callback?: Function) {
        // add a callback to args even if no callback, to avoid extra checking
        // that callback is passed by remote side
        args = args.concat(typeof callback === 'function' ? callback : noop);
    
        // invoke the provided remote method
        namespace.methods[method].apply(null, args);
    }
    
    static notifyRemoteMethodsChanged(namespace: Namespace) {
        let cursor = namespace.listeners;
    
        for (let method in namespace.remoteMethodWrappers) {
            namespace.remoteMethodWrappers[method].available =
                namespace.remoteMethods.indexOf(method) !== -1;
        }
    
        while (cursor !== null) {
            if (cursor.event === 'remoteMethodsChanged') {
                cursor.callback.call(null, namespace.remoteMethods.slice());
            }
            cursor = cursor.listeners;
        }
    };

    constructor(name: string, owner: Endpoint) {
        this.name = name;
        this.owner = owner;
        this.methods = Object.create(null);
        this.remoteMethods = [];
        this.remoteMethodWrappers = Object.create(null);
        this.listeners = null;
    }

    isMethodProvided(methodName: string) {
        return methodName in this.methods;
    }
    provide(methodName: string | MethodMap, fn?: Method) {
        if (typeof methodName === 'string') {
            if (typeof fn === 'function') {
                this.methods[methodName] = fn;
                this.owner.scheduleProvidedMethodsUpdate();
            }
        } else {
            const methods = methodName;
            for (methodName in methods) {
                if (hasOwnProperty.call(methods, methodName) &&
                    typeof methods[methodName] === 'function') {
                    this.methods[methodName] = methods[methodName];
                    this.owner.scheduleProvidedMethodsUpdate();
                }
            }
        }
    }
    revoke(methodName: string) {
        if (Array.isArray(methodName)) {
            methodName.forEach(this.revoke, this);
        } else {
            if (this.isMethodProvided(methodName)) {
                delete this.methods[methodName];
                this.owner.scheduleProvidedMethodsUpdate();
            }
        }
    }

    isRemoteMethodExists(methodName: string) {
        return this.remoteMethods.indexOf(methodName) !== -1;
    }
    callRemote(method: string, ...args: any[]) {
        let callback = null;

        if (args.length > 0 && typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }

        Namespace.send(this.owner, [{
            type: 'call',
            ns: this.name,
            method,
            args
        }, callback]);
    }
    getRemoteMethod(methodName: string) {
        let methodWrapper = this.remoteMethodWrappers[methodName];

        if (typeof methodWrapper !== 'function') {
            methodWrapper = this.remoteMethodWrappers[methodName] = (...args: any[]) => {
                if (methodWrapper.available) {
                    this.callRemote(methodName, ...args);
                } else {
                    console.warn('[rempl] ' + this.owner.getName() + ' ns(' + this.name + ') has no available remote method `' + methodName + '`');
                }
            };
            methodWrapper.available = this.remoteMethods.indexOf(methodName) !== -1;
        }

        return methodWrapper;
    }

    onRemoteMethodsChanged(callback) {
        const listener = {
            event: 'remoteMethodsChanged',
            callback,
            listeners: this.listeners
        };

        this.listeners = listener;

        callback(this.remoteMethods.slice());

        return () => {
            let cursor = this as unknown as EventListener;
            let prev;

            while (prev = cursor, cursor = cursor.listeners) {
                if (cursor === listener) {
                    prev.listeners = cursor.listeners;
                    break;
                }
            }
        };
    }
}
