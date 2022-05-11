/* eslint-env browser */
/* global rempl */

const subcriber = rempl.getSubscriber();
const output = document.body.appendChild(document.createElement('div'));

subcriber.subscribe((data) => {
    output.innerHTML = '<b>Current value:</b> ' + data;
});
