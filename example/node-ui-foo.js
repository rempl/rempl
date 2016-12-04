/* eslint-env browser */
/* global rempl */

rempl.subscribe(function(counter) {
    console.log('from observer:', arguments);
    document.getElementById('counter').innerHTML = counter;
});

var idx = 1;
setInterval(function() {
    rempl.invoke('test', N + ' back ' + (idx++));
}, 2000);

this.reset = function() {
    rempl.invoke('reset', function(x) {
        console.log('reset callback ok:', x);
    });
}

var N = 'foo';
var x = document.createElement('div');
x.innerHTML = 'foo interface <b id="counter"></b> <button onclick="reset()">reset</button>';
document.body.appendChild(x);
console.log('!foo remote tool inited');
