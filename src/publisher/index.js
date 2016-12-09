var isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';

module.exports = isNode ? require('./nodejs/index.js') : require('./browser/index.js');
module.exports.createPublisher = module.exports;
