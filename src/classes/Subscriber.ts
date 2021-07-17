import { Namespace } from '../classes/Namespace.js';
import { Endpoint } from '../classes/Endpoint.js';
import { subscribe } from '../utils/index.js';

class SubscriberNamespace extends Namespace {
    subscribers: Function[];

    constructor(name, owner) {
        super(name, owner);

        this.subscribers = [];
    }

    subscribe(fn) {
        this.callRemote('init', fn);
        return subscribe(this.subscribers, fn);
    }
}

export class Subscriber extends Endpoint<SubscriberNamespace> {
    get type() {
        return 'Subscriber';
    }

    get namespaceClass() {
        return SubscriberNamespace;
    }

    constructor(id?: string) {
        super(id);

        this.namespaceClass

        this.connected.on(connected => {
            if (connected) {
                this.requestRemoteApi();
                for (const name in this.namespaces) {
                    const ns = this.namespaces[name];
                    if (ns.subscribers.length) {
                        ns.callRemote('init', function(data) {
                            ns.subscribers.forEach(function(callback) {
                                callback(data);
                            });
                        });
                    }
                }
            } else {
                this.setRemoteApi();
            }
        });
    }

    processInput(packet, callback) {
        switch (packet.type) {
            case 'data':
                const subscribers = this.ns(packet.ns || '*').subscribers.slice();
                
                subscribers.forEach(callback => callback(packet.payload));
                break;
    
            default:
                Endpoint.prototype.processInput.call(this, packet, callback);
        }
    }
}
