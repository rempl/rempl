// process.env.REMPL_SERVER = 'host:1234';

var rempl = require('../../../src');

var publisher = rempl.createPublisher('env', rempl.scriptFromFile(__dirname + '/ui.js'));

setInterval(function() {
    publisher.publish(process.memoryUsage().heapUsed);
}, 500);
