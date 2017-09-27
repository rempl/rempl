var isNode = require('../utils/index.js').isNode;

module.exports = !isNode
    ? require('./browser/scriptFromFile.js')
    : require('./nodejs/scriptFromFile.js');

