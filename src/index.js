module.exports = {
    createPublisher: require('./publisher/index.js'),
    createSandbox: require('./sandbox/index.js'),
    getSubscriber: require('./subscriber/index.js'),

    source: require('fs').readFileSync(__dirname + '/../dist/rempl.js', 'utf8'),
    scriptFromFile: require('./sdk/scriptFromFile.js')
};
