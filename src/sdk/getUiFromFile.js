var isNode = require('../utils/index.js').isNode;

module.exports = isNode
    ? require('./nodejs/getUiFromFile.js')
    : require('./browser/getUiFromFile.js');

