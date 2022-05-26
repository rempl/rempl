import { GetRemoteUIHandler, PublisherOptions } from '../../types.js';
import EventTransport from '../../transport/event.js';
import { getPublisher, connect } from '../factory.js';
import { createBrowserWsTransport, fetchWsSettings } from './transport-ws.js';

export function createPublisher(
    id: string,
    getRemoteUI: GetRemoteUIHandler,
    options?: PublisherOptions
) {
    connect(true, createBrowserWsTransport, fetchWsSettings);

    const publisher = getPublisher(id, getRemoteUI, options);

    // browser extension
    EventTransport.get('rempl-browser-extension-publisher', 'rempl-browser-extension-host').sync(
        publisher
    );

    // in page
    EventTransport.get('rempl-inpage-publisher', 'rempl-inpage-host').sync(publisher);

    // self subscriber
    EventTransport.get('rempl-self-publisher', 'rempl-self-subscriber').sync(publisher);

    return Object.assign(publisher.ns('*'), {
        ns: publisher.ns.bind(publisher),
    });
}

export function connectPublisherWs(uri?: string) {
    connect(false, createBrowserWsTransport, fetchWsSettings, uri);
}
