/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function(api) {
    api.subscribe(function(counter) {
        document.getElementById('counter').innerHTML = counter;
    });

    window.reset = function() {
        api.callRemote('reset');
    };

    document.body
        .appendChild(document.createElement('div'))
        .innerHTML =
            '<b id="counter"></b> ' +
            '<button onclick="reset()">reset</button>';
});
