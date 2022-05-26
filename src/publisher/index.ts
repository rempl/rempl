import { GetRemoteUIHandler, PublisherOptions } from '../types.js';
import { getPublisher, connect } from './factory.js';
import { createNodeWsTransport, fetchWsSettings } from './transport-ws.js';

export function createPublisher(
    id: string,
    getRemoteUI: GetRemoteUIHandler,
    options?: PublisherOptions
) {
    connect(true, createNodeWsTransport, fetchWsSettings);

    const publisher = getPublisher(id, getRemoteUI, options);

    return Object.assign(publisher.ns('*'), {
        ns: publisher.ns.bind(publisher),
    });
}

export function connectPublisherWs(uri?: string) {
    connect(false, createNodeWsTransport, fetchWsSettings, uri);
}
