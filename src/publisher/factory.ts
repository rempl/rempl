import WSTransport from '../transport/ws.js';
import { TransportPublisher } from './TransportPublisher.js';
import { GetRemoteUIHandler, Options } from './types.js';

const publishers = new Map<string, TransportPublisher>();

export function createPublisherFactory(
    establishWsConnection: (publisher: TransportPublisher, uri?: string) => void,
    setupPublisher?: (publisher: TransportPublisher) => void
) {
    return function getPublisher(id: string, getRemoteUI: GetRemoteUIHandler, options: Options) {
        let publisher = publishers.get(id);

        if (publisher) {
            console.error(`Publisher with ID "${id}" has been already created`);
            return null;
        }

        publisher = new TransportPublisher(id, establishWsConnection, getRemoteUI, options);
        publishers.set(id, publisher);

        if (typeof setupPublisher === 'function') {
            setupPublisher(publisher);
        }

        return publisher;
    };
}

export function createWsConnectionFactory(
    WsTransport: typeof WSTransport,
    settings: { explicit: string | undefined; implicit: string }
) {
    return (publisher: TransportPublisher, uri?: string) => {
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

        if (typeof uri === 'string') {
            WsTransport.get(uri).sync(publisher);
        } else {
            console.warn(
                "[rempl] Connection to WS server doesn't established since bad value for URI",
                uri
            );
        }
    };
}
