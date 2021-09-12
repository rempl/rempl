import Token from "../classes/Token.js";

import EndpointList from "../classes/EndpointList.js";

import * as utils from "../utils";

// @ts-ignore
import socketIO from "socket.io-client/dist/socket.io.slim.js";
import Endpoint from "../classes/Endpoint";
import Namespace from "../classes/Namespace";
import { AnyFn, hasOwnProperty, TypeRecord, Unsubscribe } from "../utils";
import { GetRemoteUICallback, GetRemoteUIFn } from "./event";

const endpoints: Record<string, WSTransport> = Object.create(null);
const INFO_UPDATE_TIME = 100;
const DEBUG = false;
const DEBUG_PREFIX = "[rempl][ws-transport] ";

export type SelfInfo = Pick<
    WSTransport,
    "id" | "sessionId" | "type" | "publishers"
>;

export type API = {
    connected: Token<boolean>;
    send(...args: unknown[]): void;
    subscribe(fn: AnyFn): void;
};

function valuesChanged(a: TypeRecord | unknown[], b: TypeRecord | unknown[]) {
    for (const key in a) {
        // @ts-ignore
        const value1 = a[key];
        // @ts-ignore
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
        return "ws://localhost:" + uri;
    }

    return uri
        .replace(/^http:\/\//i, "ws://")
        .replace(/^https:\/\//i, "wss://")
        .replace(/^([a-z]+:\/\/)|^/i, function (m, protocol) {
            protocol = protocol ? protocol.toLowerCase() : "";
            return protocol === "ws://" || protocol === "wss://"
                ? protocol
                : "ws://";
        });
}

function subscribe(
    this: WSTransport,
    endpoint: string | null,
    fn: AnyFn
): Unsubscribe {
    return utils.subscribe(this.dataCallbacks, {
        endpoint: endpoint,
        fn: fn,
    });
}

function send(this: WSTransport, endpoint: string | null, callback?: AnyFn) {
    this.send("rempl:from publisher", endpoint, callback);
}

function onConnect(this: WSTransport) {
    clearInterval(this.sendInfoTimer as number);

    this.connected.set(true);
    this.info = this.getInfo();

    this.send("rempl:endpoint connect", this.info, (data) => {
        if ("id" in data) {
            this.setClientId(data.id);
        }

        this.sendInfoTimer = setInterval(
            this.sendInfo.bind(this),
            INFO_UPDATE_TIME
        );
    });

    if (DEBUG) {
        console.log(DEBUG_PREFIX + "connected");
    }
}

function onGetUI(
    this: WSTransport,
    id: string | null,
    settings: unknown,
    callback: GetRemoteUICallback
) {
    if (!hasOwnProperty(this.publishersMap, id as string)) {
        if (DEBUG) {
            console.error(
                DEBUG_PREFIX + "Publisher `" + id + "` isn't registered"
            );
        }

        callback("Publisher `" + id + "` isn't registered");
        return;
    }

    this.publishersMap[id as string].getRemoteUI.call(
        null,
        settings || {},
        callback
    );
}

function onData(this: WSTransport, id: string | null, ...args: unknown[]) {
    if (!hasOwnProperty(this.publishersMap, id as string)) {
        if (DEBUG) {
            console.error(
                DEBUG_PREFIX + "Publisher `" + id + "` isn't registered"
            );
        }

        return;
    }

    this.dataCallbacks.forEach(function (callback) {
        if (callback.endpoint === id) {
            callback.fn.apply(null, args);
        }
    });
}

function onDisconnect(this: WSTransport) {
    if (DEBUG) {
        console.log(DEBUG_PREFIX + "disconnected");
    }

    clearInterval(this.sendInfoTimer as number);
    this.connected.set(false);
}

export default class WSTransport {
    sessionId = utils.genUID();
    id: string | null = null;
    sendInfoTimer: number | NodeJS.Timeout | null = null;
    info = {};

    publishers: Array<string | null> = [];
    publishersMap: Record<string, { getRemoteUI: GetRemoteUIFn }> = {};
    dataCallbacks: Array<{ endpoint: string | null; fn: AnyFn }> = [];

    connected = new Token(false);
    ownEndpoints = new EndpointList();
    remoteEndpoints = new EndpointList();

    transport: { emit(...args: unknown[]): void };

    constructor(uri: string) {
        if (DEBUG) {
            console.log(DEBUG_PREFIX + "connecting to " + normalizeUri(uri));
        }

        this.transport = socketIO
            .connect(normalizeUri(uri))
            .on("connect", onConnect.bind(this))
            .on("disconnect", onDisconnect.bind(this))
            .on("rempl:get ui", onGetUI.bind(this))
            .on("rempl:to publisher", onData.bind(this));
    }

    static get(endpoint: string): WSTransport {
        if (endpoint in endpoints) {
            return endpoints[endpoint];
        }

        return (endpoints[endpoint] = new this(endpoint));
    }

    type = "unknown";
    infoFields = ["id", "sessionId", "type", "publishers"] as const;

    setClientId(id: string): void {
        this.id = id;
    }

    /**
     * Send data through WS
     */
    send(name: string, arg: unknown, callback?: AnyFn): void {
        this.transport.emit(name, arg, callback);
    }

    /**
     * Get self info
     */
    getInfo(): SelfInfo {
        const result: SelfInfo = {} as SelfInfo;

        this.infoFields.forEach((name) => {
            // @ts-ignore
            result[name] = Array.isArray(this[name])
                ? // @ts-ignore
                  this[name].slice()
                : this[name];
        });

        return result;
    }

    /**
     * Send self info to server
     */
    sendInfo(): void {
        const newInfo = this.getInfo();

        if (valuesChanged(this.info, newInfo)) {
            this.info = newInfo;
            this.send("rempl:endpoint info", this.info);
        }
    }

    createApi(
        endpoint: Endpoint<Namespace> & { getRemoteUI?: GetRemoteUIFn }
    ): API | undefined {
        if (hasOwnProperty(this.publishersMap, endpoint.id as string)) {
            if (DEBUG) {
                console.error(
                    DEBUG_PREFIX +
                        "Publisher `" +
                        endpoint.id +
                        "` is already registered"
                );
            }

            return;
        }

        this.publishers.push(endpoint.id);
        // todo точно всегда есть getRemoteUI
        this.publishersMap[endpoint.id as string] = {
            getRemoteUI: endpoint.getRemoteUI as GetRemoteUIFn,
        };

        this.sendInfo();

        return {
            connected: this.connected,
            send: send.bind(this, endpoint.id),
            subscribe: subscribe.bind(this, endpoint.id),
        };
    }

    sync(endpoint: Endpoint<Namespace>): void {
        const api = this.createApi(endpoint);
        if (!api) {
            return;
        }
        api.subscribe(endpoint.processInput);
        api.connected.link(function (connected) {
            endpoint.setupChannel(
                "ws",
                api.send,
                this.remoteEndpoints,
                connected
            );
        }, this);
    }
}
