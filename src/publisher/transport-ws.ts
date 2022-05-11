import * as fs from 'fs';
import * as path from 'path';
import socketIO from 'socket.io-client';
import WsTransport from '../transport/ws.js';
import { createWsConnectionFactory } from './factory.js';

const CLIENT_ID_FILENAME = path.resolve('.rempl_endpoint_id'); // FIXME: dirty solution

function fetchWsSettings() {
    function fetchEnvVariable() {
        return process.env.REMPL_SERVER;
    }

    const setup: string | undefined = fetchEnvVariable();
    const implicitUri = 'ws://localhost:8177';
    let explicitUri = undefined;

    switch (setup) {
        case 'none':
        case 'false':
        case undefined:
            // no explicit setting
            break;

        case 'implicit':
        case 'auto':
        case 'true':
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
    socketIO = socketIO;
    static settings = fetchWsSettings();
    get type() {
        return 'node';
    }

    constructor(uri: string) {
        super(uri);

        // TODO make it through temp file
        if (fs.existsSync(CLIENT_ID_FILENAME)) {
            this.id = fs.readFileSync(CLIENT_ID_FILENAME, 'utf-8');
        }
    }

    setClientId(id: string) {
        super.setClientId(id);
        fs.writeFileSync(CLIENT_ID_FILENAME, String(this.id));
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
