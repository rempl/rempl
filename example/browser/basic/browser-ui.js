/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function(api) {
    var output = document.body.appendChild(document.createElement('div'));
    var providedMethods = document.body.appendChild(document.createElement('div'));

    api.subscribe(function(data) {
        output.innerHTML = new Date(data).toTimeString();
    });

    api.onRemoteMethodsChanged(function(methods) {
        providedMethods.innerHTML = '<ul>' + methods.map(x => '<li>' + x + '</li>').join('') + '</ul>';
    });
});
