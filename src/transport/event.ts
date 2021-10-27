/* eslint-env browser */

import Token from '../classes/Token.js';
import EndpointList from '../classes/EndpointList.js';
import EndpointListSet from '../classes/EndpointListSet.js';
import Endpoint from '../classes/Endpoint.js';
import Namespace from '../classes/Namespace.js';
import * as utils from '../utils/index.js';
import { global, AnyFn, Fn, hasOwnProperty, Unsubscribe } from '../utils/index.js';

const DEBUG = false;
const DEBUG_PREFIX = '[rempl][event-transport] ';

export type ConnectPayload = {
    initiator: string;
    inited: boolean;
    endpoints: string[];
};

export type OnInitCallbackArg = {
    connected: Token<boolean>;
    getRemoteUI(callback?: AnyFn): void;
    subscribe(fn: AnyFn): Unsubscribe;
    send(...args: unknown[]): void;
};

export type OnInitCallback = (arg: OnInitCallbackArg) => void;
export type OnInitFnArgs = [endpoint: Endpoint<Namespace>, callback: OnInitCallback];

export type Connection = {
    ttl: number;
    endpoints: EndpointList;
};

export type GetRemoteUICallback = (
    // todo should not be string
    error: string | Error | null,
    type?: 'script',
    content?: string
) => void;

export type GetRemoteUISettings = {
    dev: boolean;
    [key: string]: unknown;
};
export type GetRemoteUIFnArgs = [settings: GetRemoteUISettings, callback: GetRemoteUICallback];
export type GetRemoteUIFn = (...args: GetRemoteUIFnArgs) => void;

export type CallbackPayload<TArgs extends unknown[]> = {
    type: 'callback';
    callback: Fn<TArgs, void>;
    data: TArgs;
};

export type OnDataPayload =
    | {
          type: 'connect';
          endpoints: string[];
      }
    | {
          type: 'endpoints';
          data: [string[]];
      }
    | {
          type: 'disconnect';
      }
    | {
          type: 'callback';
          callback: string;
          data: unknown[];
      }
    | {
          type: 'data';
          data: unknown;
          callback: AnyFn;
          endpoint: string;
      }
    | {
          type: 'getRemoteUI';
          endpoint: string;
          data: GetRemoteUISettings[];
          callback: AnyFn;
      };

export default class EventTransport {
    static all: EventTransport[] = [];

    static get(name: string, connectTo: string, win?: Window | typeof global): EventTransport {
        if (!win) {
            win = global;
        }

        const transport = EventTransport.all.find(
            (transport) =>
                transport.connectTo === connectTo &&
                transport.window === win &&
                transport.name === name
        );

        return transport || new EventTransport(name, connectTo, win);
    }

    name: string;
    connectTo: string;
    window: Window | typeof global;
    inputChannelId: string;
    connections: Record<string, Connection> = Object.create(null);
    connected = new Token(false);
    endpointGetUI: Record<string, GetRemoteUIFn> = {};
    ownEndpoints = new EndpointList();
    remoteEndpoints = new EndpointListSet();

    initCallbacks: OnInitFnArgs[] = [];
    dataCallbacks: Array<{ endpoint: string; fn: AnyFn }> = [];
    sendCallbacks: Record<string, AnyFn> = {};
    inited = false;

    constructor(name: string, connectTo: string, win?: Window | typeof global) {
        EventTransport.all.push(this);

        this.name = name;
        this.connectTo = connectTo;
        this.inputChannelId = name + ':' + utils.genUID();

        this.ownEndpoints.on(function (endpoints) {
            if (this.connected.value) {
                this.send({
                    type: 'endpoints',
                    data: [endpoints],
                });
            }
        }, this);

        this.window = win || global;

        if (
            typeof this.window.postMessage !== 'function' ||
            typeof addEventListener !== 'function'
        ) {
            utils.warn(DEBUG_PREFIX + "Event (postMessage) transport isn't supported");
            return;
        }

        addEventListener('message', (e: MessageEvent) => this._onMessage(e), false);
        this._handshake(false);
    }

    _handshake(inited: boolean) {
        const payload: ConnectPayload = {
            initiator: this.name,
            inited,
            endpoints: this.ownEndpoints.value,
        };

        this._send(this.connectTo + ':connect', payload);
    }

    _onMessage(event: MessageEvent) {
        const data = event.data || {};
        const payload = data.payload || {};

        if (event.source !== this.window || event.target !== global) {
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
                    utils.warn(DEBUG_PREFIX + 'unknown incoming connection', data.from);
                }
                break;
        }
    }

    _onConnect(from: string, payload: ConnectPayload) {
        if (!payload.inited) {
            this._handshake(true);
        }

        if (!(from in this.connections)) {
            const endpoints = new EndpointList(payload.endpoints);
            this.remoteEndpoints.add(endpoints);
            this.connections[from] = {
                ttl: Date.now(),
                endpoints: endpoints,
            };
            this._send(from, {
                type: 'connect',
                endpoints: this.ownEndpoints.value,
            });
        }

        this.inited = true;
    }

    _onData(from: string, payload: OnDataPayload) {
        if (DEBUG) {
            utils.log(DEBUG_PREFIX + 'receive from ' + this.connectTo, payload.type, payload);
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
                if (hasOwnProperty(this.sendCallbacks, payload.callback)) {
                    this.sendCallbacks[payload.callback].apply(null, payload.data);
                    delete this.sendCallbacks[payload.callback];
                }
                break;
            }

            case 'data': {
                let args = Array.prototype.slice.call(payload.data);
                const callback = payload.callback;

                if (callback) {
                    args = args.concat(this._wrapCallback(from, callback));
                }

                this.dataCallbacks.forEach(function (callback) {
                    if (callback.endpoint === payload.endpoint) {
                        callback.fn.apply(null, args);
                    }
                });
                break;
            }
            case 'getRemoteUI': {
                if (!hasOwnProperty(this.endpointGetUI, payload.endpoint)) {
                    utils.warn(
                        DEBUG_PREFIX +
                            'receive unknown endpoint for getRemoteUI(): ' +
                            payload.endpoint
                    );
                    this._wrapCallback(
                        from,
                        payload.callback
                    )('Wrong endpoint – ' + payload.endpoint);
                } else {
                    this.endpointGetUI[payload.endpoint](
                        payload.data[0] || false,
                        payload.callback ? this._wrapCallback(from, payload.callback) : () => void 0
                    );
                }
                break;
            }

            default:
                utils.warn(
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

    _wrapCallback<TArgs extends unknown[]>(to: string, callback: Fn<TArgs, void>) {
        return (...args: TArgs): void => {
            const callbackPayload: CallbackPayload<TArgs> = {
                type: 'callback',
                callback: callback,
                data: args,
            };
            this._send(to, callbackPayload);
        };
    }

    _send(to: string, payload: unknown) {
        if (DEBUG) {
            utils.log(DEBUG_PREFIX + 'emit event', to, payload);
        }

        if (typeof this.window.postMessage === 'function') {
            this.window.postMessage(
                {
                    from: this.inputChannelId,
                    to: to,
                    payload: payload,
                },
                '*'
            );
        }
    }

    subscribeToEndpoint(endpoint: string | null, fn: AnyFn) {
        return utils.subscribe(this.dataCallbacks, {
            endpoint: endpoint,
            fn: fn,
        });
    }

    sendToEndpoint(endpoint: string | null, type: string, ...args: unknown[]) {
        // if (endpoint !== this.remoteName && this.remoteEndpoints.value.indexOf(endpoint) === -1) {
        //     // console.warn(this.name, endpoint, this.remoteName, this.remoteEndpoints.value);
        //     if (1||DEBUG) {
        //         utils.warn(DEBUG_PREFIX + '' + this.name + ' send({ type: `' + type + '` }) to endpoint is cancelled since no `' + endpoint + '` in remote endpoint list [' + this.remoteEndpoints.value.join(', ') + ']', arguments[2]);
        //     }
        //     return;
        // }

        let callback: string | boolean = false;

        if (args.length && typeof args[args.length - 1] === 'function') {
            callback = utils.genUID();
            this.sendCallbacks[callback] = args.pop() as AnyFn;
        }

        this.send({
            type: type,
            endpoint: endpoint,
            data: args,
            callback: callback,
        });
    }

    send(payload: unknown) {
        // if (!this.inited) {
        //     utils.warn(DEBUG_PREFIX + 'send() call on init is prohibited');
        //     return;
        // }

        for (const channelId in this.connections) {
            this._send(channelId, payload);
        }
    }

    onInit(
        endpoint: Endpoint<Namespace> & { getRemoteUI?: GetRemoteUIFn },
        callback: OnInitCallback
    ) {
        const id = endpoint.id || null;

        if (id) {
            this.ownEndpoints.set(this.ownEndpoints.value.concat(id));

            if (typeof endpoint.getRemoteUI === 'function') {
                this.endpointGetUI[id] = endpoint.getRemoteUI;
            }
        }

        if (this.inited) {
            callback({
                connected: this.connected,
                getRemoteUI: this.sendToEndpoint.bind(this, id, 'getRemoteUI'),
                subscribe: this.subscribeToEndpoint.bind(this, id),
                send: this.sendToEndpoint.bind(this, id, 'data'),
            });
        } else {
            this.initCallbacks.push([endpoint, callback]);
        }

        return this;
    }

    sync(endpoint: Endpoint<Namespace>) {
        const channel = utils.genUID(8) + ':' + this.connectTo;
        const remoteEndpoints = this.remoteEndpoints;

        this.onInit(endpoint, function (api) {
            api.subscribe(endpoint.processInput);
            api.connected.link((connected) => {
                endpoint.setupChannel(channel, api.send, remoteEndpoints, connected);
            });
        });

        return this;
    }
}
