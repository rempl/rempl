/* eslint-env browser */
/* global rempl */

const subscriber = rempl.getSubscriber();
const output = document.createElement('div');
const providedMethods = document.createElement('div');

document.body.append(output, providedMethods);

subscriber.subscribe((data) => {
    output.innerHTML = new Date(data).toTimeString();
});

subscriber.onRemoteMethodsChanged((methods) => {
    providedMethods.innerHTML =
        '<h3>Publisher methods:</h3>' +
        '<ul>' +
        methods.map((methodName) => '<li>' + methodName + '</li>').join('') +
        '</ul>';
});

subscriber.connected.link((state) => {
    console.log('publisher connected:', state);
});
