/* eslint-env browser */

import { GetRemoteUIFn } from '../../transport/event.js';

declare const rempl: () => void;

export function scriptFromFile(filename: string, includeRempl = false): GetRemoteUIFn {
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
                    (response) =>
                        callback(
                            null,
                            'script',
                            (cache =
                                (includeRempl && typeof rempl === 'function'
                                    ? 'var rempl = (' + rempl.toString() + ')();'
                                    : '') + response)
                        ),
                    (error) => callback(error.message)
                );
        } else {
            callback(null, 'script', cache);
        }
    };
}
