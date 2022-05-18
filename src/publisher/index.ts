import { getPublisher, connect } from './factory.js';
import { createNodeWsTransport, fetchWsSettings } from './transport-ws.js';

export const createPublisher = getPublisher;

export function connectPublisherWs(uri?: string) {
    connect(createNodeWsTransport, fetchWsSettings, uri);
}
