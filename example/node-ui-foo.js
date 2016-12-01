/* eslint-env browser */
/* global CustomEvent */

var host = parent;
var getRemoteAPI = window.name || location.hash.substr(1);
var remoteAPI = typeof host[getRemoteAPI] === 'function' ? host[getRemoteAPI]() : null;

remoteAPI.subscribe(function(data) {
    console.log('from observer:', arguments);
    document.getElementById('counter').innerHTML = data.payload;
});

var idx = 1;
setInterval(function() {
    remoteAPI.send(N + ' back ' + (idx++));
}, 2000);

function reset() {
    remoteAPI.invoke('reset', function(x) {
        console.log('callback ok:', x);
    });
}

var N = 'foo';
var x = document.createElement('div');
x.innerHTML = 'foo interface <b id="counter"></b> <button onclick="reset()">reset</button>';
document.body.appendChild(x);
console.log('!foo remote tool inited');
