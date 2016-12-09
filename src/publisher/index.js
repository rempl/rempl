var isNode = require('../utils/index.js').isNode;

module.exports = isNode
    ? require('./nodejs/index.js')
    : require('./browser/index.js');

