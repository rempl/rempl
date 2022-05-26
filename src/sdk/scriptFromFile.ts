import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GetRemoteUIHandler } from '../types.js';

export function scriptFromFile(filename: string, includeRempl = false): GetRemoteUIHandler {
    const remplPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../dist/rempl.js'
    );
    let cache: string | null = null;

    // TODO: take in account settings.accept setting
    return function (settings) {
        if (!settings.dev && cache !== null) {
            return { type: 'script', value: cache };
        }

        return fs.promises.readFile(filename, 'utf-8').then((content) => {
            return {
                type: 'script',
                value: (cache = (includeRempl ? fs.readFileSync(remplPath, 'utf8') : '') + content),
            };
        });
    };
}
