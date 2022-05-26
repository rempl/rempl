/* eslint-env browser */

import ReactiveValue from '../classes/ReactiveValue.js';
import EndpointList from '../classes/EndpointList.js';
import EndpointListSet from '../classes/EndpointListSet.js';
import * as utils from '../utils/index.js';
import { globalThis, AnyFn, UnsubscribeFn } from '../utils/index.js';
import {
    HandshakeEventMessagePayload,
    EventMessagePayload,
    GetRemoteUIInternalHandler,
    CallbackEventMessagePayload,
} from '../types.js';
import { EventMessage } from '../types.js';
import { Publisher } from '../classes/Publisher.js';
import { Subscriber } from '../classes/Subscriber.js';

const DEBUG = false;
const DEBUG_PREFIX = '[rempl][event-transport] ';

export type TransportEndpoint = (Publisher | Subscriber | { id?: string }) & {
    getRemoteUI?: GetRemoteUIInternalHandler;
};

export type OnInitCallbackArg = {
    connected: ReactiveValue<boolean>;
    subscribe(fn: AnyFn): UnsubscribeFn;
    getRemoteUI(callback?: AnyFn): void;
    send(...args: unknown[]): void;
};

export type OnInitCallback = (arg: OnInitCallbackArg) => void;
export type OnInitFnArgs = [endpoint: TransportEndpoint, callback: OnInitCallback];

export type Connection = {
    ttl: number;
    endpoints: EndpointList;
};

export type CallbackPayload<TArgs extends unknown[]> = {
    type: 'callback';
    callback(...args: TArgs): void;
    data: TArgs;
};

const allTransports: EventTransport[] = [];

export default class EventTransport {
    static get(name: string, connectTo: string, win?: Window | typeof globalThis): EventTransport {
        if (!win) {
            win = globalThis;
        }

        const transport = allTransports.find(
            (transport) =>
                transport.name === name &&
                transport.connectTo === connectTo &&
                transport.realm === win
        );

        return transport || new EventTransport(name, connectTo, win);
    }

    name: string;
    connectTo: string;
    realm: Window | typeof globalThis;
    inputChannelId: string;
    connections: Record<string, Connection> = Object.create(null);
    connected = new ReactiveValue(false);
    endpointGetUI = new Map<string, GetRemoteUIInternalHandler>();
    ownEndpoints = new EndpointList();
    remoteEndpoints = new EndpointListSet();

    initCallbacks: OnInitFnArgs[] = [];
    dataCallbacks: Array<{ endpoint: string; fn: AnyFn }> = [];
    sendCallbacks = new Map<string, AnyFn>();
    inited = false;

    constructor(name: string, connectTo: string, win?: Window | typeof globalThis) {
        if (allTransports.length === 0 && typeof addEventListener === 'function') {
            addEventListener(
                'message',
                (e: MessageEvent) => {
                    for (const transport of allTransports) {
                        transport._onMessage(e);
                    }
                },
                false
            );
        }

        allTransports.push(this);

        this.name = name;
        this.connectTo = connectTo;
        this.inputChannelId = name + ':' + utils.genUID();
        this.realm = win || globalThis;

        this.ownEndpoints.on((endpoints) => {
            if (this.connected.value) {
                this.send({
                    type: 'endpoints',
                    data: [endpoints],
                });
            }
        });

        if (
            typeof this.realm.postMessage !== 'function' ||
            typeof addEventListener !== 'function'
        ) {
            console.warn(DEBUG_PREFIX + "Event (postMessage) transport isn't supported");
            return;
        }

        this._handshake(false);
    }

    _handshake(inited: boolean) {
        const payload: HandshakeEventMessagePayload = {
            type: 'handshake',
            initiator: this.name,
            inited,
            endpoints: this.ownEndpoints.value,
        };

        this._send(this.connectTo + ':connect', payload);
    }

    _onMessage(event: MessageEvent) {
        const data = event.data || {};
        const payload = data.payload || {};

        if (event.source !== this.realm || event.target !== globalThis) {
            return;
        }

        switch (data.to) {
            case this.name + ':connect':
                if (payload.initiator === this.connectTo) {
                    this._onConnect(data.from, payload);
                }
                break;

            case this.inputChannelId:
                if (data.from in this.connections) {
                    this._onData(data.from, payload);
                } else {
                    console.warn(DEBUG_PREFIX + 'unknown incoming connection', data.from);
                }
                break;
        }
    }

    _onConnect(from: string, payload: HandshakeEventMessagePayload) {
        if (!payload.inited) {
            this._handshake(true);
        }

        if (from in this.connections === false) {
            const endpoints = new EndpointList(payload.endpoints);

            this.remoteEndpoints.add(endpoints);
            this.connections[from] = {
                ttl: Date.now(),
                endpoints,
            };
            this._send(from, {
                type: 'connect',
                endpoints: this.ownEndpoints.value,
            });
        }

        this.inited = true;
    }

    _onData(from: string, payload: EventMessagePayload) {
        if (DEBUG) {
            console.log(DEBUG_PREFIX + 'receive from ' + this.connectTo, payload.type, payload);
        }

        switch (payload.type) {
            case 'connect': {
                this.connections[from].endpoints.set(payload.endpoints);
                this.connected.set(true);
                this.initCallbacks.splice(0).forEach((args) => this.onInit(...args));
                break;
            }

            case 'endpoints': {
                this.connections[from].endpoints.set(payload.data[0]);
                break;
            }

            case 'disconnect': {
                this.connections[from].endpoints.set([]);
                this.connected.set(false);
                break;
            }

            case 'callback': {
                if (payload.callback) {
                    const callback = this.sendCallbacks.get(payload.callback);

                    if (typeof callback === 'function') {
                        callback(...payload.data);
                        this.sendCallbacks.delete(payload.callback);
                    }
                }
                break;
            }

            case 'data': {
                let args = Array.prototype.slice.call(payload.data);
                const callback = payload.callback;

                if (callback) {
                    args = args.concat(this._wrapCallback(from, callback));
                }

                for (const { endpoint, fn } of this.dataCallbacks) {
                    if (endpoint === payload.endpoint) {
                        fn(...args);
                    }
                }
                break;
            }
            case 'getRemoteUI': {
                if (!payload.endpoint) {
                    return;
                }

                const getUI = this.endpointGetUI.get(payload.endpoint);

                if (typeof getUI !== 'function') {
                    console.warn(
                        DEBUG_PREFIX +
                            'receive unknown endpoint for getRemoteUI(): ' +
                            payload.endpoint
                    );

                    if (payload.callback) {
                        this._wrapCallback(
                            from,
                            payload.callback
                        )('Wrong endpoint – ' + payload.endpoint);
                    }
                } else {
                    if (payload.callback) {
                        const callback = this._wrapCallback(from, payload.callback);

                        getUI(payload.data[0] || {})
                            .catch((error) => ({ error: String(error?.message) }))
                            .then((res) => {
                                if ('error' in res) {
                                    callback(res.error);
                                } else {
                                    callback(null, res.type, res.value);
                                }
                            });
                    }
                }
                break;
            }

            default:
                console.warn(
                    DEBUG_PREFIX +
                        'Unknown message type `' +
                        // @ts-ignore
                        payload.type +
                        '` for `' +
                        this.name +
                        '`',
                    payload
                );
        }
    }

    _wrapCallback(to: string, callback: string) {
        return (...args: unknown[]) => {
            const callbackPayload: CallbackEventMessagePayload = {
                type: 'callback',
                callback,
                data: args,
            };
            this._send(to, callbackPayload);
        };
    }

    _send(to: string, payload: HandshakeEventMessagePayload | EventMessagePayload) {
        if (DEBUG) {
            console.log(DEBUG_PREFIX + 'emit event', to, payload);
        }

        if (typeof this.realm.postMessage === 'function') {
            const message: EventMessage = {
                from: this.inputChannelId,
                to,
                payload,
            };

            this.realm.postMessage(message);
        }
    }

    subscribeToEndpoint(endpoint: string | null, fn: AnyFn) {
        return utils.subscribe(this.dataCallbacks, {
            endpoint,
            fn,
        });
    }

    sendToEndpoint<
        M extends Extract<EventMessagePayload, { endpoint: string | null }>,
        K extends M['type']
    >(endpoint: string | null, type: K, ...args: any) {
        let callback: string | null = null;

        if (args.length && typeof args[args.length - 1] === 'function') {
            callback = utils.genUID();
            this.sendCallbacks.set(callback, args.pop() as AnyFn);
        }

        this.send({
            type,
            endpoint,
            data: args,
            callback,
        });
    }

    send(payload: EventMessagePayload) {
        for (const channelId in this.connections) {
            this._send(channelId, payload);
        }
    }

    onInit(endpoint: TransportEndpoint, callback: OnInitCallback) {
        const id = endpoint.id || null;

        if (id) {
            this.ownEndpoints.set(this.ownEndpoints.value.concat(id));

            if (typeof endpoint.getRemoteUI === 'function') {
                this.endpointGetUI.set(id, endpoint.getRemoteUI);
            }
        }

        if (this.inited) {
            callback({
                connected: this.connected,
                subscribe: this.subscribeToEndpoint.bind(this, id),
                getRemoteUI: this.sendToEndpoint.bind(this, id, 'getRemoteUI'),
                send: this.sendToEndpoint.bind(this, id, 'data'),
            });
        } else {
            this.initCallbacks.push([endpoint, callback]);
        }

        return this;
    }

    sync(endpoint: Publisher | Subscriber) {
        const channel = utils.genUID(8) + ':' + this.connectTo;

        this.onInit(endpoint, (api) => {
            api.subscribe(endpoint.processInput.bind(endpoint));
            api.connected.link((connected) => {
                endpoint.setupChannel(channel, api.send, this.remoteEndpoints, connected);
            });
        });

        return this;
    }
}
