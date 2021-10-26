import Publisher from '../classes/Publisher';
import remplSource from '../source';
import { createWsConnectionFactory } from './factory';
import { GetRemoteUIHandler, Options, RequestClientHandler } from './types';

function resolveWsUri(uri?: string | boolean) {
    let resolvedUri: string | boolean = false;

    switch (uri) {
        case 'implicit':
        case 'auto':
        case true:
            resolvedUri = 'implicit';
            break;

        case 'explicit':
        case undefined:
            resolvedUri = 'explicit';
            break;

        case false:
            // decline connection, do nothing
            return;

        default:
            if (typeof uri === 'string') {
                resolvedUri = uri;
            } else {
                console.warn(
                    '[rempl] Bad value of `options.ws` option for `createPublisher(.., .., options)`'
                );
                return;
            }
    }

    return resolvedUri;
}

export class TransportPublisher extends Publisher {
    getRemoteUI_: GetRemoteUIHandler;
    establishWsConnection: ReturnType<typeof createWsConnectionFactory>;
    options: Options;

    constructor(
        id: string,
        establishWsConnection: ReturnType<typeof createWsConnectionFactory>,
        getRemoteUI: GetRemoteUIHandler,
        options?: Options
    ) {
        super(id);
        this.establishWsConnection = establishWsConnection;
        this.getRemoteUI_ = getRemoteUI;
        this.getRemoteUI = this.getRemoteUI.bind(this);
        this.options = options || {};

        const resolvedUri = resolveWsUri(this.options.ws);
        if (typeof resolvedUri === 'string') {
            this.connectWs(resolvedUri);
        }
    }

    connectWs(uri?: string) {
        this.establishWsConnection(this, uri);
    }

    getRemoteUI(settings: unknown, callback: RequestClientHandler) {
        this.getRemoteUI_(
            settings,
            (error: string | null, type: 'url' | 'script', content: string) => {
                let response: Record<string, string> | null = null;

                if (!error && type === 'script') {
                    // send with user script rempl source too
                    response = {
                        'rempl.js': remplSource,
                        'publisher-ui.js': content,
                    };
                }

                callback(error, type, response);
            }
        );
    }
}
