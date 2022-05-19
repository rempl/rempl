/* eslint-env browser */

import socketIO from 'socket.io-client/dist/socket.io.slim.js';
import WsTransport from '../../transport/ws.js';
import { postIdentifyMessage, startIdentify, stopIdentify } from './identify/index.js';
import { globalThis, top } from '../../utils/index.js';

const STORAGE_KEY = 'rempl:id';
declare let REMPL_SERVER: string | boolean;

export function fetchWsSettings() {
    function fetchEnvVariable() {
        if (typeof REMPL_SERVER !== 'undefined' && REMPL_SERVER !== globalThis.REMPL_SERVER) {
            return REMPL_SERVER;
        }
    }

    function fetchMeta() {
        const meta =
            typeof document !== 'undefined'
                ? document.querySelector('meta[name="rempl:server"]')
                : undefined;

        return (meta && meta.getAttribute('content')) || undefined;
    }

    const implicitUri = location.protocol + '//' + (location.hostname || 'localhost') + ':8177';
    let explicitUri = undefined;
    let setup = fetchEnvVariable();

    if (setup === undefined) {
        setup = fetchMeta();
    }

    switch (setup) {
        case 'none':
        case undefined:
        case false:
            // no explicit setting
            break;

        case 'implicit':
        case 'auto':
        case true:
            explicitUri = implicitUri;
            break;

        default:
            if (typeof setup === 'string') {
                explicitUri = setup;
            }
    }

    return {
        explicit: explicitUri,
        implicit: implicitUri,
    };
}

export class BrowserWsTransport extends WsTransport {
    constructor(uri: string) {
        super(uri, socketIO);

        const self = this;

        try {
            this.id = sessionStorage[STORAGE_KEY];
        } catch (e) {}

        this.socket
            .on(
                'rempl:identify',
                function (num: string | number, callback: (publisherId: string) => void) {
                    startIdentify((this as any).io.uri, num, callback);

                    for (const publisherId of self.publishers) {
                        postIdentifyMessage({
                            op: 'add-publisher',
                            id: publisherId,
                            name: publisherId,
                        });
                    }
                }
            )
            .on('rempl:stop identify', stopIdentify)
            .on('disconnect', stopIdentify);
    }

    get type() {
        return 'browser';
    }

    setClientId(id: string) {
        super.setClientId(id);
        try {
            sessionStorage[STORAGE_KEY] = this.id;
        } catch (e) {}
    }

    getInfo() {
        return {
            ...super.getInfo(),
            location: String(location),
            title: top?.document?.title || top?.location?.href || 'Unknown',
        };
    }
}

export function createBrowserWsTransport(uri: string) {
    return new BrowserWsTransport(uri);
}
