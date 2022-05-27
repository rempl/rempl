import type { Publisher } from './classes/Publisher.js';

export type { Endpoint } from './classes/Endpoint.js';
export type { EndpointList } from './classes/EndpointList.js';
export type { EndpointListSet } from './classes/EndpointListSet.js';
export type { Namespace } from './classes/Namespace.js';
export type { ReactiveValue } from './classes/ReactiveValue.js';
export type { Publisher, PublisherNamespace } from './classes/Publisher.js';
export type { Subscriber, SubscriberNamespace } from './classes/Subscriber.js';
export type { EventTransport } from './transport/event.js';
export type { WsTransport } from './transport/ws.js';

export type MethodsMap = Record<string, string[]>;

// base messages
export type CallMessage = {
    type: 'call';
    ns?: string;
    method: string;
    args: unknown[];
};
export type RemoteMethodsMessage = {
    type: 'remoteMethods';
    methods: MethodsMap;
};
export type GetProvidedMethodsMessage = {
    type: 'getProvidedMethods';
};

// publisher -> subscriber
export type DataMessage = {
    type: string;
    ns?: string;
    payload: unknown;
};

// event transport messages
export type EventTransportHandshakePayload = {
    type: 'handshake';
    initiator: EventTransportEndpoint;
    inited: boolean;
    endpoints: string[];
};
export type ConnectEventMessagePayload = {
    type: 'connect';
    endpoints: string[];
};
export type DisconnectEventMessagePayload = {
    type: 'disconnect';
};
export type EndpointsEventMessagePayload = {
    type: 'endpoints';
    data: [endpoints: string[]];
};
export type CallbackEventMessagePayload = {
    type: 'callback';
    data: unknown[];
    callback: string | null;
};
export type DataEventMessagePayload = {
    type: 'data';
    endpoint: string | null;
    data: unknown[];
    callback: string | null;
};
export type GetRemoveUIEventMessagePayload = {
    type: 'getRemoteUI';
    endpoint: string | null;
    data: [settings: GetRemoteUISettings];
    callback: string | null;
};
export type EventTransportMessagePayload =
    | ConnectEventMessagePayload
    | EndpointsEventMessagePayload
    | DisconnectEventMessagePayload
    | CallbackEventMessagePayload
    | DataEventMessagePayload
    | GetRemoveUIEventMessagePayload;
export type EventTransportEndpoint =
    | 'rempl-sandbox'
    | 'rempl-subscriber'
    | 'rempl-inpage-publisher'
    | 'rempl-inpage-host'
    | 'rempl-browser-extension-publisher'
    | 'rempl-browser-extension-host'
    | 'rempl-self-publisher'
    | 'rempl-self-subscriber'
    | 'rempl-env-publisher'
    | 'rempl-env-subscriber';
export type EventTransportConnectTo = `${EventTransportEndpoint}:connect`;
export type EventTransportChannelId = `${EventTransportEndpoint}/${string}`;
export type EventTransportHandshakeMessage = {
    from: EventTransportChannelId;
    to: EventTransportConnectTo;
    payload: EventTransportHandshakePayload;
};
export type EventTransportDataMessage = {
    from: EventTransportChannelId;
    to: EventTransportChannelId;
    payload: EventTransportMessagePayload;
};
export type EventTransportMessage = EventTransportHandshakeMessage | EventTransportDataMessage;

//
// Remote UI
//

export type GetRemoteUISettings = {
    dev?: boolean;
    [key: string]: unknown;
};

export type GetRemoteUIResult =
    | {
          type: 'script';
          value: string;
      }
    | { type: 'url'; value: string };
export type GetRemoteUIHandler = (
    settings: GetRemoteUISettings
) => GetRemoteUIResult | Promise<GetRemoteUIResult>;

export type GetRemoteUIInternalResult =
    | { error: string }
    | { type: 'script'; value: Record<string, string> }
    | { type: 'url'; value: string };
export type GetRemoteUIInternalHandler = (
    settings: GetRemoteUISettings
) => Promise<GetRemoteUIInternalResult>;

//
// Publisher
//

export type PublisherOptions = { ws?: string };
export type PublisherWsSettings = {
    explicit: string | undefined;
    implicit: string;
};

//
// Host
//

export type Host = {
    activate(publisher?: Publisher | string): void;
    deactivate(publisher?: Publisher | string): void;
};

//
// Sandbox
//

export type Sandbox = {
    setConnected(state: boolean): void;
    destroy(): void;
};
