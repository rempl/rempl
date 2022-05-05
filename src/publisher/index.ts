import { establishWsConnection } from './transport-ws.js';
import { createPublisherFactory } from './factory.js';
import remplSource from '../utils/source.js';

export const createPublisher = createPublisherFactory(remplSource, establishWsConnection);
