var toolRemote = require('rempl-smth').provide('my-tool', function(settings, callback) {
    callback(null, 'script', 'console.log("my-tool", new Date())');
});

toolRemote.connected.subscribe(function(connected) {
    var someNS = toolRemote.ns('some');
    
    someNS.send({
        type: 'tree',
        payload: data
    });
    someNS.subscribe({
        select: function() {

        }
    })
});
