import WSTransport from '../transport/ws.js';
import { TransportPublisher } from './TransportPublisher.js';
import { GetRemoteUIHandler, Options, WsSettings } from './types.js';

const publishers = new Map<string, TransportPublisher>();
let ws: WSTransport | null = null;

export function getPublisher(id: string, getRemoteUI: GetRemoteUIHandler, options?: Options) {
    let publisher = publishers.get(id);

    if (publisher) {
        console.warn(`[rempl] Publisher with ID "${id}" has been already created`);
        return publisher;
    }

    publisher = new TransportPublisher(id, getRemoteUI, options);
    publishers.set(id, publisher);

    if (ws) {
        ws.sync(publisher);
    }

    return publisher;
}

export function resolveWsUri(
    settings: { explicit: string | undefined; implicit: string },
    uri?: string
) {
    switch (uri) {
        case 'implicit':
        case undefined:
            uri = settings.explicit || settings.implicit;
            break;

        case 'explicit':
            uri = settings.explicit;

            // when no explicit setting do nothing
            if (uri === undefined) {
                return;
            }

            break;
    }

    return uri;
}

export function connect(
    createWsTransport: (uri: string) => WSTransport,
    fetchWsSettings: () => WsSettings,
    uri?: string
) {
    if (ws === null) {
        uri = resolveWsUri(fetchWsSettings(), uri);

        if (typeof uri === 'string') {
            ws = createWsTransport(uri);

            for (const publisher of publishers.values()) {
                ws.sync(publisher);
            }
        } else {
            console.warn(
                "[rempl] Connection to WS server doesn't established since bad value for URI",
                uri
            );
        }
    } else {
        console.warn('[rempl] Connection to WS server already set');
    }
}
