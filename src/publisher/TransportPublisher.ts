import { Publisher } from '../classes/Publisher.js';
import { GetRemoteUIHandler, Options, RequestClientHandler } from './types.js';

export class TransportPublisher extends Publisher {
    getRemoteUI: (settings: unknown, callback: RequestClientHandler) => void;
    options: Options;

    constructor(id: string, getRemoteUI: GetRemoteUIHandler, options?: Options) {
        super(id);

        this.options = options || {};
        this.getRemoteUI = (settings, callback) => {
            getRemoteUI(
                settings,
                (error: string | null, type: 'url' | 'script', content: string) => {
                    let response: Record<string, string> | string | null = content;

                    if (!error && type === 'script') {
                        // send with user script rempl source too
                        response = {
                            'publisher-ui.js': content,
                        };
                    }

                    callback(error, type, response);
                }
            );
        };
    }
}
