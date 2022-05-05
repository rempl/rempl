import * as path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const sourceFilePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../dist/rempl.js'
);

export default readFileSync(sourceFilePath, 'utf8');
