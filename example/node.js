// process.env.REMPL_SERVER = 'localhost:1234';

var rempl = require('../src');
var myTool = rempl.createPublisher('myTool', rempl.scriptFromFile(__dirname + '/node-ui.js'));

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
