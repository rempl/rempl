// TODO: make it useful
module.exports = {
    createPublisher: require('./publisher/index.js'),
    createSubscriber: require('./subscriber/index.js'),

    scriptFromFile: require('./sdk/scriptFromFile.js')
};
