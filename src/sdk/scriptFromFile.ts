import * as fs from 'fs';
import { GetRemoteUIFn } from '../transport/event.js';

export function scriptFromFile(filename: string): GetRemoteUIFn {
    let cache: string | null = null;

    // TODO: take in account settings.accept setting
    return function (settings, callback) {
        if (settings.dev || cache === null) {
            fs.readFile(filename, 'utf-8', function (err, content) {
                if (err) {
                    return callback(err);
                }

                cache = content;
                callback(null, 'script', content);
            });
        } else {
            callback(null, 'script', cache);
        }
    };
}
