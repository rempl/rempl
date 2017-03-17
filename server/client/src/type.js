module.exports = {
    Publisher: require('./type/publisher.js'),
    Endpoint: require('./type/endpoint.js')
};

require('basis.entity').validate();
