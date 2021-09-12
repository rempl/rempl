var Namespace = require("../classes/Namespace.js");
var Endpoint = require("../classes/Endpoint.js");

var PublisherNamespace = function (name, owner) {
    Namespace.call(this, name, owner);

    this.provide(
        "init",
        function (callback) {
            callback(this._lastData);
        }.bind(this)
    );
};

PublisherNamespace.prototype = Object.create(Namespace.prototype);
PublisherNamespace.prototype._lastData = null;
PublisherNamespace.prototype.publish = function (payload) {
    this._lastData = payload;
    Namespace.send(this.owner, [
        {
            type: "data",
            ns: this.name,
            payload: payload,
        },
    ]);
};

PublisherNamespace.prototype.pipe = function (fn, init) {
    var publisher = this;
    var pipe = function () {
        publisher.publish(fn.apply(this, arguments));
    };

    if (!fn) {
        init = false;
        fn = function (value) {
            return value;
        };
    }

    if (init || init === undefined) {
        pipe();
    }

    return pipe;
};

var Publisher = function (id) {
    Endpoint.call(this, id);
};

Publisher.prototype = Object.create(Endpoint.prototype);
Publisher.prototype.namespaceClass = PublisherNamespace;
Publisher.prototype.type = "Publisher";

module.exports = Publisher;
