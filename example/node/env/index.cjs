// process.env.REMPL_SERVER = 'localhost:8177';
const rempl = require('rempl');
const publisher = rempl.createPublisher('env', rempl.scriptFromFile(__dirname + '/ui.js', true));

setInterval(() => publisher.publish(process.memoryUsage().heapUsed), 500);
