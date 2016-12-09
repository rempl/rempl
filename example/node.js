var fs = require('fs');
var rempl = require('../src');

var myTool = rempl.createPublisher('myTool', function(settings, callback) {
    callback(null, 'script',
        fs.readFileSync(__dirname + '/node-ui.js', 'utf-8')
    );
});

// ----

var counter = 1;
setInterval(function() {
    myTool.publish(counter++);
}, 500);

myTool.define({
    reset: function() {
        counter = 1;
        myTool.publish(counter);
    }
});
