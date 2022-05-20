/* eslint-env browser */

import { GetRemoteUIHandler, GetRemoteUISettings } from '../../transport/types.js';

declare const rempl: () => void;

export function scriptFromFile(filename: string, includeRempl = false): GetRemoteUIHandler {
    let cache: string | null = null;

    // TODO: take in account settings.accept setting
    return function (settings: GetRemoteUISettings) {
        if (!settings.dev && cache !== null) {
            return { type: 'script', value: cache };
        }

        return fetch(filename)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! File "${filename}", status: ${response.status}`);
                }

                return response.text();
            })
            .then((response) => ({
                type: 'script',
                value: (cache =
                    (includeRempl && typeof rempl === 'function'
                        ? 'var rempl = (' + rempl.toString() + ')();'
                        : '') + response),
            }));
    };
}
