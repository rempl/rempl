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
export type HandshakeEventMessagePayload = {
    type: 'handshake';
    initiator: string;
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
    data: [string[]];
};
export type CallbackEventMessagePayload = {
    type: 'callback';
    data: unknown[];
    callback: string | null;
};
export type DataEventMessagePayload = {
    type: 'data';
    endpoint: string | null;
    data: unknown;
    callback: string | null;
};
export type GetRemoveUIEventMessagePayload = {
    type: 'getRemoteUI';
    endpoint: string | null;
    data: GetRemoteUISettings[];
    callback: string | null;
};
export type EventMessagePayload =
    | ConnectEventMessagePayload
    | EndpointsEventMessagePayload
    | DisconnectEventMessagePayload
    | CallbackEventMessagePayload
    | DataEventMessagePayload
    | GetRemoveUIEventMessagePayload;
export type EventMessage = {
    from: string;
    to: string;
    payload: HandshakeEventMessagePayload | EventMessagePayload;
};

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
