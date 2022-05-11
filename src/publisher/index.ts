import { establishWsConnection } from './transport-ws.js';
import { createPublisherFactory } from './factory.js';

export const createPublisher = createPublisherFactory(establishWsConnection);
