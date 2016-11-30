var Observer = require('../observer.js');
var makeSync = require('./sync.js');

module.exports = Observer.factory(function(id, getRemoteUI) {
    return makeSync(new Observer(id, getRemoteUI));
});
