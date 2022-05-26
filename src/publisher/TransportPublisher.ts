import { Publisher } from '../classes/Publisher.js';
import {
    GetRemoteUIHandler,
    PublisherOptions,
    GetRemoteUIInternalResult,
    GetRemoteUISettings,
} from '../types.js';

export class TransportPublisher extends Publisher {
    getRemoteUI: (settings: GetRemoteUISettings) => Promise<GetRemoteUIInternalResult>;
    options: PublisherOptions;

    constructor(id: string, getRemoteUI: GetRemoteUIHandler, options?: PublisherOptions) {
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
