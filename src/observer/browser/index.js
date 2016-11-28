var Observer = require('../observer.js');
var createObserver = require('../base.js');
var makeSync = require('./sync.js');

module.exports = createObserver(function(id, getRemoteUI) {
    return makeSync(new Observer(id, getRemoteUI));
});
