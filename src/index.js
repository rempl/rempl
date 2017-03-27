module.exports = {
    version: require('../package.json').version,
    source: require('fs').readFileSync(__dirname + '/../dist/rempl.js', 'utf8'),

    createPublisher: require('./publisher/index.js'),
    createSandbox: require('./sandbox/index.js'),
    getSubscriber: require('./subscriber/index.js'),

    scriptFromFile: require('./sdk/scriptFromFile.js')
};
