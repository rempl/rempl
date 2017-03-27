module.exports = {
    version: require('../package.json').version,
    source: require('./source.js'),

    createPublisher: require('./publisher/index.js'),
    createSandbox: require('./sandbox/index.js'),
    getSubscriber: require('./subscriber/index.js'),

    scriptFromFile: require('./sdk/scriptFromFile.js')
};
