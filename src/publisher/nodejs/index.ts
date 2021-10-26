import { establishWsConnection } from './transport-ws.js';
import { createPublisherFactory } from '../factory.js';

export default createPublisherFactory(establishWsConnection);
