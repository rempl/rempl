import { version } from './utils/version.js';
import { createEnv, getEnv } from './env/browser/index.js';
import getHost from './host/in-page/index.js';
import createSandbox from './sandbox/browser/index.js';
import { createPublisher, connectPublisherWs } from './publisher/browser/index.js';
import { getSubscriber, getSelfSubscriber } from './subscriber/browser/index.js';
import { scriptFromFile } from './sdk/browser/scriptFromFile.js';

export {
    version,
    getEnv,
    getHost,
    createPublisher,
    connectPublisherWs,
    getSubscriber,
    getSelfSubscriber,
    scriptFromFile,
    // TODO: move to a special module
    createEnv,
    createSandbox,
};
