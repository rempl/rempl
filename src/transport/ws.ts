// @ts-ignore
import { ReactiveValue } from '../classes/ReactiveValue.js';
import { EndpointList } from '../classes/EndpointList.js';
import * as utils from '../utils/index.js';
import { AnyFn } from '../utils/index.js';
import { GetRemoteUIInternalHandler, GetRemoteUISettings } from '../types.js';
import { TransportPublisher } from '../publisher/TransportPublisher.js';

const endpoints: Record<string, WsTransport> = Object.create(null);
const INFO_UPDATE_TIME = 100;
const DEBUG = false;
const DEBUG_PREFIX = '[rempl][ws-transport] ';

export type SelfInfo = Pick<WsTransport, 'id' | 'sessionId' | 'type' | 'publishers'>;

export type API = {
    connected: ReactiveValue<boolean>;
    send(...args: unknown[]): void;
    subscribe(fn: AnyFn): void;
};

interface Socket {
    emit(...args: unknown[]): void;
    on(event: string, callback: AnyFn): this;
}

function valuesChanged(a: any, b: any) {
    for (const key of Object.keys(a)) {
        const value1 = a[key];
        const value2 = b[key];

        if (Array.isArray(value1)) {
            if (valuesChanged(value1, value2)) {
                return true;
            }
        } else {
            if (String(value1) !== String(value2)) {
                return true;
            }
        }
    }

    return false;
}

function normalizeUri(uri: string) {
    uri = String(uri);

    if (/^\d+$/.test(uri)) {
        return 'ws://localhost:' + uri;
    }

    return uri
        .replace(/^http:\/\//i, 'ws://')
        .replace(/^https:\/\//i, 'wss://')
        .replace(/^([a-z]+:\/\/)|^/i, function (m, protocol) {
            protocol = protocol ? protocol.toLowerCase() : '';
            return protocol === 'ws://' || protocol === 'wss://' ? protocol : 'ws://';
        });
}

function subscribe(this: WsTransport, endpoint: string | null, fn: AnyFn) {
    return utils.subscribe(this.dataCallbacks, {
        endpoint,
        fn,
    });
}

function send(this: WsTransport, endpoint: string | null, callback?: AnyFn) {
    this.send('rempl:from publisher', endpoint, callback);
}

function onConnect(this: WsTransport) {
    clearInterval(this.sendInfoTimer as number);

    this.connected.set(true);
    this.info = this.getInfo();

    this.send('rempl:endpoint connect', this.info, (data) => {
        if ('id' in data) {
            this.setClientId(data.id);
        }

        this.sendInfoTimer = setInterval(this.sendInfo.bind(this), INFO_UPDATE_TIME);
    });

    if (DEBUG) {
        console.log(DEBUG_PREFIX + 'connected');
    }
}

function onGetUI(
    this: WsTransport,
    id: string | null,
    settings: GetRemoteUISettings,
    callback: (
        error: string | null,
        type?: 'url' | 'script',
        value?: string | Record<string, string>
    ) => void
) {
    const publisherMeta = this.publishersMap.get(id as string);

    if (!publisherMeta) {
        if (DEBUG) {
            console.error(DEBUG_PREFIX + 'Publisher `' + id + "` isn't registered");
        }

        callback('Publisher `' + id + "` isn't registered");
        return;
    }

    return publisherMeta
        .getRemoteUI(settings || {})
        .catch((error) => ({ error: String(error?.message) }))
        .then((res) => {
            if ('error' in res) {
                callback(res.error);
            } else {
                callback(null, res.type, res.value);
            }
        });
}

function onData(this: WsTransport, id: string | null, ...args: unknown[]) {
    if (!this.publishersMap.has(id as string)) {
        if (DEBUG) {
            console.error(DEBUG_PREFIX + 'Publisher `' + id + "` isn't registered");
        }

        return;
    }

    this.dataCallbacks.forEach(function (callback) {
        if (callback.endpoint === id) {
            callback.fn.apply(null, args);
        }
    });
}

function onDisconnect(this: WsTransport) {
    if (DEBUG) {
        console.log(DEBUG_PREFIX + 'disconnected');
    }

    clearInterval(this.sendInfoTimer as number);
    this.connected.set(false);
}

export class WsTransport {
    static get(endpoint: string, socketIO: any): WsTransport {
        if (endpoint in endpoints) {
            return endpoints[endpoint];
        }

        return (endpoints[endpoint] = new this(endpoint, socketIO));
    }

    publishers: string[] = [];
    publishersMap = new Map<string, { getRemoteUI: GetRemoteUIInternalHandler }>();
    dataCallbacks: Array<{ endpoint: string | null; fn: AnyFn }> = [];

    connected = new ReactiveValue(false);
    ownEndpoints = new EndpointList();
    remoteEndpoints = new EndpointList();

    socket: Socket;

    sessionId = utils.genUID();
    id: string | null = null;
    sendInfoTimer: number | NodeJS.Timeout | null = null;
    info = this.getInfo();

    constructor(uri: string, socketIO: any) {
        if (DEBUG) {
            console.log(DEBUG_PREFIX + 'connecting to ' + normalizeUri(uri));
        }

        this.socket = socketIO
            .connect(normalizeUri(uri), { transports: ['websocket'] })
            .on('connect', onConnect.bind(this))
            .on('disconnect', onDisconnect.bind(this))
            .on('rempl:get ui', onGetUI.bind(this))
            .on('rempl:to publisher', onData.bind(this));
    }

    get type(): string {
        return 'unknown';
    }

    setClientId(id: string): void {
        this.id = id;
    }

    /**
     * Send data through WS
     */
    send(name: string, arg: unknown, callback?: AnyFn): void {
        this.socket.emit(name, arg, callback);
    }

    /**
     * Get self info
     */
    getInfo(): SelfInfo {
        return {
            id: this.id,
            sessionId: this.sessionId,
            type: this.type,
            publishers: [...this.publishers],
        };
    }

    /**
     * Send self info to server
     */
    sendInfo() {
        const newInfo = this.getInfo();

        if (valuesChanged(this.info, newInfo)) {
            this.info = newInfo;
            this.send('rempl:endpoint info', this.info);
        }
    }

    createApi(publisher: TransportPublisher): API | undefined {
        if (this.publishersMap.has(publisher.id as string)) {
            if (DEBUG) {
                console.error(
                    DEBUG_PREFIX + 'Publisher `' + publisher.id + '` is already registered'
                );
            }

            return;
        }

        if (publisher.id) {
            this.publishers.push(publisher.id);
            // todo точно всегда есть getRemoteUI
            this.publishersMap.set(publisher.id, {
                getRemoteUI: publisher.getRemoteUI,
            });
        }

        this.sendInfo();

        return {
            connected: this.connected,
            send: send.bind(this, publisher.id),
            subscribe: subscribe.bind(this, publisher.id),
        };
    }

    sync(publisher: TransportPublisher) {
        const api = this.createApi(publisher);

        if (api) {
            api.subscribe(publisher.processInput.bind(publisher));
            api.connected.link((connected) => {
                publisher.setupChannel('ws', api.send, this.remoteEndpoints, connected);
            });
        }
    }
}
