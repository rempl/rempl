import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GetRemoteUIFn } from '../transport/event.js';

export function scriptFromFile(filename: string, includeRempl = false): GetRemoteUIFn {
    const remplPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../dist/rempl.js'
    );
    let cache: string | null = null;

    // TODO: take in account settings.accept setting
    return function (settings, callback) {
        if (settings.dev || cache === null) {
            fs.readFile(filename, 'utf-8', function (err, content) {
                if (err) {
                    return callback(err);
                }

                cache = (includeRempl ? fs.readFileSync(remplPath, 'utf8') : '') + content;
                callback(null, 'script', content);
            });
        } else {
            callback(null, 'script', cache);
        }
    };
}
