var Namespace = require('../classes/Namespace.js');
var Endpoint = require('../classes/Endpoint.js');
var publishers = Object.create(null);

var PublisherNamespace = function(name, owner) {
    Namespace.call(this, name, owner);

    this.methods.init = function(callback) {
        callback(this._lastData);
    }.bind(this);
};

PublisherNamespace.prototype = Object.create(Namespace.prototype);
PublisherNamespace.prototype._lastData = null;
PublisherNamespace.prototype.publish = function(payload) {
    this._lastData = payload;
    Namespace.send(this.owner, [{
        type: 'data',
        ns: this.name,
        payload: payload
    }]);
};

var Publisher = function(id, getRemoteUI) {
    Endpoint.call(this);
    this.id = id;
    this.getRemoteUI = getRemoteUI;

    publishers[id] = this;
    Publisher.onPublishersChange(Object.keys(publishers));
};

Publisher.prototype = Object.create(Endpoint.prototype);
Publisher.prototype.namespaceClass = PublisherNamespace;
Publisher.prototype.getName = function() {
    return 'Publisher `' + this.id + '`';
};

Publisher.onPublishersChange = function(/* publishers */) {
    /* stub method */
};

Publisher.factory = function createPublisherFactory(Publisher) {
    return function getPublisher(id, getRemoteUI, endpoint) {
        var publisher = publishers[id];

        if (!publisher) {
            publisher = new Publisher(id, getRemoteUI, endpoint);
        }

        return publisher;
    };
};

module.exports = Publisher;
