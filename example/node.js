var fs = require('fs');
var createRemplObserver = require('../src/observer');

var foo = createRemplObserver('foo', function(settings, callback) {
    callback(null, 'script', fs.readFileSync(__dirname + '/node-ui-foo.js', 'utf-8'));
}, 'ws://localhost:8000');

var fooidx = 1;
setInterval(function() {
    foo.send('foo/' + (fooidx++));
}, 1000);

foo.define({
    test: function(msg) {
        console.log('foo recieve "test"', msg);
    },
    reset: function(cb) {
        fooidx = 1;
        foo.send('foo/' + fooidx);
        console.log('foo recieve "reset"', arguments);
        cb('reset done');
    }
});
