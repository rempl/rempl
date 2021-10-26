import fs from 'fs';
import path from 'path';
import WsTransport from '../../transport/ws.js';
import { createWsConnectionFactory } from '../factory';

const CLIENT_ID_FILENAME = path.resolve('.rempl_endpoint_id'); // FIXME: dirty solution

function fetchWsSettings() {
    function fetchEnvVariable() {
        return process.env.REMPL_SERVER;
    }

    var setup = fetchEnvVariable();
    var implicitUri = 'ws://localhost:8177';
    var explicitUri = undefined;

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

export class NodeWsTransport extends WsTransport {
    static settings = fetchWsSettings();
    get type() {
        return 'node';
    }

    constructor(uri) {
        super(uri);

        // TODO make it through temp file
        if (fs.existsSync(CLIENT_ID_FILENAME)) {
            this.id = fs.readFileSync(CLIENT_ID_FILENAME, 'utf-8');
        }
    }

    setClientId(id) {
        super.setClientId(id);
        fs.writeFileSync(CLIENT_ID_FILENAME, this.id);
    }

    getInfo() {
        return {
            ...super.getInfo(),
            pid: process.pid,
            title: process.title,
        };
    }
}

export const establishWsConnection = createWsConnectionFactory(
    NodeWsTransport,
    NodeWsTransport.settings
);
