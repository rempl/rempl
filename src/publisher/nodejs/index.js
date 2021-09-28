import WsTransport from './transport-ws.js';
import attachWsTransport from '../ws.js';
import createFactory from '../factory.js';
import addGetRemoteUI from '../getRemoteUI.js';

export default createFactory(function setupPublisher(publisher, getRemoteUI, options) {
    addGetRemoteUI(publisher, getRemoteUI);
    attachWsTransport(publisher, WsTransport, options);
});
