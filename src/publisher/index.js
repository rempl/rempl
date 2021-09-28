// import { isNode } from '../utils/index.js';

// module.exports = !isNode ? require('./browser/index.js') : require('./nodejs/index.js').default;
module.exports = require('./browser/index.js');
