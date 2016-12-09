/* eslint-env browser */
/* global rempl */

var output = document.body
    .appendChild(document.createElement('div'));

rempl.subscribe(function(data) {
    output.innerHTML = new Date(data).toTimeString() + 'hello Avito';
});
