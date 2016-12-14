var isNode = require('../utils/index.js').isNode;

module.exports = isNode
    ? require('./nodejs/scriptFromFile.js')
    : require('./browser/scriptFromFile.js');

