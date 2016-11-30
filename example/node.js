var createRemplObserver = require('../src/observer/nodejs');

var sub = function(){
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
    function reset(){
        remoteAPI.invoke('reset', function(x) {
            console.log('callback ok:', x);
        });
    }
}.toString().replace(/^function.+\{/, '').replace(/\}$/, '');

var fooidx = 1;
var foo = createRemplObserver('foo', function(settings, callback) {
    callback(null, 'script', 'var N = "foo";' + sub + 'var x = document.createElement("div");x.innerHTML = "foo interface <b id=\\"counter\\"></b> <button onclick=\\"reset()\\">reset</button>";document.body.appendChild(x);console.log("!foo remote tool inited")');
}, 'ws://localhost:8000');
setInterval(function() {
    foo.send('foo/' + (fooidx++));
}, 1000);

foo.define({
    reset: function(cb) {
        fooidx = 1;
        foo.send('foo/' + fooidx);
        console.log('foo recieve "reset"', arguments);
        cb('reset done');
    }
});
