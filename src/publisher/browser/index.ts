import EventTransport from '../../transport/event.js';
import { createPublisherFactory } from '../factory.js';
import { establishWsConnection } from './transport-ws.js';
import { TransportPublisher } from '../TransportPublisher.js';
import { setPublisherList } from './identify.js';

const publishers = new Set<string>();

export const createPublisher = createPublisherFactory(
    establishWsConnection,
    (publisher: TransportPublisher) => {
        publishers.add(publisher.id as string);
        setPublisherList([...publishers]);

        // browser extension
        EventTransport.get(
            'rempl-browser-extension-publisher',
            'rempl-browser-extension-host'
        ).sync(publisher);

        // in page
        EventTransport.get('rempl-inpage-publisher', 'rempl-inpage-host').sync(publisher);

        // self subscriber
        EventTransport.get('rempl-self-publisher', 'rempl-self-subscriber').sync(publisher);
    }
);
