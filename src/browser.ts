import { createEnv, getEnv } from './env/browser/index.js';
import getHost from './host/in-page/index.js';
import createSandbox from './sandbox/browser/index.js';
import createPublisher from './publisher/browser/index.js';
import getSubscriber from './subscriber/browser/index.js';
import scriptFromFile from './sdk/browser/scriptFromFile.js';

const version = 'fixme';

export {
    version,
    getEnv,
    getHost,
    createPublisher,
    getSubscriber,
    scriptFromFile,
    // TODO: move to a special module
    createEnv,
    createSandbox,
};
