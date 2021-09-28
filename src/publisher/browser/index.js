import EventTransport from '../../transport/event.js';
import WsTransport from './transport-ws.js';
import attachWsTransport from '../ws.js';
import createFactory from '../factory.js';
import addGetRemoteUI from '../getRemoteUI.js';
import { updatePublisherList } from './identify.js';

module.exports = createFactory(function setupPublisher(publisher, getRemoteUI, options) {
    addGetRemoteUI(publisher, getRemoteUI);

    // browser extension
    EventTransport.get('rempl-browser-extension-publisher', 'rempl-browser-extension-host').sync(
        publisher
    );

    // in page
    EventTransport.get('rempl-inpage-publisher', 'rempl-inpage-host').sync(publisher);

    attachWsTransport(publisher, WsTransport, options);
}, updatePublisherList);
