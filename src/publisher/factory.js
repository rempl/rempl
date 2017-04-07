var Publisher = require('../classes/Publisher.js');
var publishers = Object.create(null);

module.exports = function createPublisherFactory(fn, onPublishersChange) {
    return function getPublisher(id) {
        if (id in publishers === false) {
            publishers[id] = new Publisher(id);
            fn.apply(null, [publishers[id]].concat(Array.prototype.slice.call(arguments, 1)));
            if (typeof onPublishersChange === 'function') {
                onPublishersChange(Object.keys(publishers));
            }
        }

        return publishers[id];
    };
};
