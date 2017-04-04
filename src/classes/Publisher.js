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
    Endpoint.call(this, id);

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
};

Publisher.prototype = Object.create(Endpoint.prototype);
Publisher.prototype.namespaceClass = PublisherNamespace;
Publisher.prototype.getName = function() {
    return 'Publisher `' + this.id + '`';
};

Publisher.onPublishersChange = function(/* publishers */) {
    /* stub method */
};

Publisher.factory = function createPublisherFactory(fn) {
    return function getPublisher(id, getRemoteUI, options) {
        if (id in publishers === false) {
            publishers[id] = new Publisher(id, getRemoteUI);
            fn(publishers[id], options);
            Publisher.onPublishersChange(Object.keys(publishers));
        }

        return publishers[id];
    };
};

module.exports = Publisher;
