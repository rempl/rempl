/* eslint-env browser */

import { GetRemoteUIFn } from '../../transport/event.js';

export default function (filename: string): GetRemoteUIFn {
    let cache: string | null = null;

    // TODO: take in account settings.accept setting
    return function (settings, callback) {
        if (settings.dev || cache === null) {
            fetch(filename)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! File "${filename}", status: ${response.status}`
                        );
                    }

                    return response.text();
                })
                .then(
                    (response) => callback(null, 'script', (cache = response)),
                    (error) => callback(error.message)
                );
        } else {
            callback(null, 'script', cache);
        }
    };
}
