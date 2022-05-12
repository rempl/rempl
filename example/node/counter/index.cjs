// process.env.REMPL_SERVER = 'localhost:8177';
const rempl = require('rempl');
const publisher = rempl.createPublisher(
    'counter',
    rempl.scriptFromFile(__dirname + '/ui.js', true)
);

// ----

let counter = 1;
setInterval(() => publisher.publish(counter++), 500);

publisher.provide('reset', () => {
    counter = 1;
    publisher.publish(counter);
});
