/* eslint-env browser */

import { GetRemoteUIFn } from '../../transport/event.js';

function fetchFile(filename: string, callback: (error: string | null, response?: string) => void) {
    const xhr = new XMLHttpRequest();
    xhr.onerror = function () {
        callback('An error occurred while transferring the file – `' + filename + '`');
    };
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(null, xhr.responseText);
            } else {
                callback(
                    'There was a problem with the file request – `' +
                        filename +
                        '` (status: ' +
                        xhr.status +
                        ')'
                );
            }
        }
    };
    xhr.open('GET', filename, true);
    xhr.send(null);
}

export default function (filename: string): GetRemoteUIFn {
    let cache: string | null = null;

    // TODO: take in account settings.accept setting
    return function (settings, callback) {
        if (settings.dev || cache === null) {
            fetchFile(filename, (err: string | null, content?: string): void => {
                if (err) {
                    callback(err);
                }

                cache = content ?? null;
                callback(null, 'script', content);
            });
        } else {
            callback(null, 'script', cache);
        }
    };
}
