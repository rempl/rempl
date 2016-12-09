/* eslint-env browser */
/* global rempl */

rempl.subscribe(function(counter) {
    document.getElementById('counter').innerHTML = counter;
});

this.reset = function() {
    rempl.invoke('reset');
};

document.body
    .appendChild(document.createElement('div'))
    .innerHTML =
        '<b id="counter"></b> ' +
        '<button onclick="reset()">reset</button>';
