var isNode = require('../utils/index.js').isNode;

module.exports = !isNode
    ? require('./browser/index.js')
    : require('./nodejs/index.js');

