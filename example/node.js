var fs = require('fs');
var createRemplProvider = require('../src/provider');

var foo = createRemplProvider('foo', function(settings, callback) {
    callback(null, 'script', fs.readFileSync(__dirname + '/node-ui-foo.js', 'utf-8'));
}, 'ws://localhost:8000');

var fooidx = 1;
setInterval(function() {
    foo.send('foo/' + (fooidx++));
}, 1000);

foo.define({
    test: function(msg) {
        console.log('foo receive "test"', msg);
    },
    reset: function(cb) {
        fooidx = 1;
        foo.send('foo/' + fooidx);
        console.log('foo receive "reset"', arguments);
        cb('reset done');
    }
});
