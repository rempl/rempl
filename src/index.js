import { version } from '../package.json';
import { source } from './source';
import env from './env';
import createSandbox from './sandbox';
import getHost from './host/in-page';
import createPublisher from './publisher';
import getSubscriber from './subscriber';
import scriptFromFile from './sdk/scriptFromFile.js';

export default {
    version,
    source,
    ...env,
    createSandbox,
    getHost,
    createPublisher,
    getSubscriber,
    scriptFromFile,
};
