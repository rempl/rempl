/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function(api) {
    var output = document.body.appendChild(document.createElement('div'));

    api.subscribe(function(data) {
        output.innerHTML = new Date(data).toTimeString();
    });
});
