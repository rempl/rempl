var Namespace = require('../classes/Namespace.js');
var Endpoint = require('../classes/Endpoint.js');
var publishers = Object.create(null);
var remplSource = require('../source.js');

var PublisherNamespace = function(name, owner) {
    Namespace.call(this, name, owner);

    this.provide('init', function(callback) {
        callback(this._lastData);
    }.bind(this));
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
    this.getRemoteUI = function(settings, callback) {
        getRemoteUI(settings, function(error, type, content) {
            if (!error && type === 'script') {
                // send with user script rempl source too
                content = {
                    'rempl.js': remplSource,
                    'publisher-ui.js': content
                };
            }

            callback(error, type, content);
        });
    };

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

Publisher.factory = function createPublisherFactory(createPublisher) {
    return function getPublisher(id, getRemoteUI, options) {
        var publisher = publishers[id];

        if (!publisher) {
            publisher = createPublisher(id, getRemoteUI, options);
        }

        return publisher;
    };
};

module.exports = Publisher;
