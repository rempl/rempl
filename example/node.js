var fs = require('fs');
var createRemplPublisher = require('../src/publisher');

var myTool = createRemplPublisher('myTool', function(settings, callback) {
    callback(null, 'script',
        fs.readFileSync(__dirname + '/node-ui.js', 'utf-8')
    );
});

// ----

var counter = 1;
setInterval(function() {
    myTool.send(counter++);
}, 500);

myTool.define({
    reset: function() {
        counter = 1;
        myTool.send(counter);
    }
});
