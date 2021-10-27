// please, make appropriate changes in scripts/process-rempl-bundle.js when update this assignment
import { readFileSync } from 'fs';

export default readFileSync(__dirname + '/../dist/rempl.js', 'utf8');
