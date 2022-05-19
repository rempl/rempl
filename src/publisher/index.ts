import { GetRemoteUIHandler, Options } from './types.js';
import { getPublisher, connect } from './factory.js';
import { createNodeWsTransport, fetchWsSettings } from './transport-ws.js';

export function createPublisher(id: string, getRemoteUI: GetRemoteUIHandler, options?: Options) {
    connect(true, createNodeWsTransport, fetchWsSettings);

    return getPublisher(id, getRemoteUI, options);
}

export function connectPublisherWs(uri?: string) {
    connect(false, createNodeWsTransport, fetchWsSettings, uri);
}
