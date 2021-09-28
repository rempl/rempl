/* eslint-env browser */
/* global REMPL_SERVER */

import WsTransport from '../../transport/ws-publisher.js';
import identify from './identify.js';
import { global } from '../../utils/index.js';

const STORAGE_KEY = 'rempl:id';
const sessionStorage = global.sessionStorage || {};

function fetchWsSettings() {
    function fetchEnvVariable() {
        if (typeof REMPL_SERVER !== 'undefined' && REMPL_SERVER !== global.REMPL_SERVER) {
            return REMPL_SERVER;
        }
    }

    function fetchMeta() {
        const meta = document.querySelector && document.querySelector('meta[name="rempl:server"]');

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

export default class BrowserWsTransport extends WsTransport {
    static settings = fetchWsSettings();

    title = '';
    location = '';

    constructor(uri: string) {
        super(uri);

        this.id = sessionStorage[STORAGE_KEY];
        this.transport
            .on('rempl:identify', identify.start)
            .on('rempl:stop identify', identify.stop)
            .on('disconnect', identify.stop);
    }

    setClientId(id: string): void {
        super.setClientId(id);
        sessionStorage[STORAGE_KEY] = this.id;
    }

    get type(): string {
        return 'browser';
    }
    get infoFields(): readonly string[] {
        return super.infoFields.concat('title', 'location');
    }

    getInfo() {
        this.title = global.top.document.title;
        this.location = String(location);
        return super.getInfo();
    }
}
