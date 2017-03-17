// process.env.REMPL_SERVER = 'host:1234';

var rempl = require('../../../src');
var publisher = rempl.createPublisher('counter', rempl.scriptFromFile(__dirname + '/ui.js'));

// ----

var counter = 1;
setInterval(function() {
    publisher.publish(counter++);
}, 500);

publisher.provide('reset', function() {
    counter = 1;
    publisher.publish(counter);
});
