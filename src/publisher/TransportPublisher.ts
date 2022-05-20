import { Publisher } from '../classes/Publisher.js';
import {
    GetRemoteUIHandler,
    Options,
    GetRemoteUIInternalResult,
    GetRemoteUISettings,
} from './types.js';

export class TransportPublisher extends Publisher {
    getRemoteUI: (settings: GetRemoteUISettings) => Promise<GetRemoteUIInternalResult>;
    options: Options;

    constructor(id: string, getRemoteUI: GetRemoteUIHandler, options?: Options) {
        super(id);

        this.options = options || {};
        this.getRemoteUI = (settings) => {
            try {
                return Promise.resolve(getRemoteUI(settings)).then((result) => {
                    if (result.type === 'script') {
                        // TODO: value should be a string
                        return {
                            type: 'script',
                            value: {
                                'publisher-ui.js': result.value,
                            },
                        };
                    }

                    return result;
                });
            } catch (e: any) {
                return Promise.reject(e);
            }
        };
    }
}
