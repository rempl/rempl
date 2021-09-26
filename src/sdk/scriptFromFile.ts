import { isNode } from '../utils';

export default !isNode
    ? require('./browser/scriptFromFile.js')
    : require('./nodejs/scriptFromFile.js');
