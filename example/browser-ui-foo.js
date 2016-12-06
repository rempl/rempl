rempl.subscribe(function(data) {
    console.log('from observer:', data);
});
rempl.ns('ns').subscribe(function(data) {
    console.log('namespaced from observer:', data);
});

rempl.define({
    test: function(a1, a2, cb) {
        console.log('invoke ns(*).test', a1, a2);
        cb(rempl.id + '.ns(*) callback works');
    }
});
rempl.ns('ns').define({
    xxxtest: function(a1, a2, cb) {
        console.log('invoke ns(ns).xxxtest', a1, a2);
        cb(rempl.id + '.ns(ns) callback works');
    }
});

var idx = 1;
setInterval(function() {
    rempl.invoke('test', rempl.id + ' back ' + (idx++), function(res) {
        console.log('callback from provider.ns(*).test', res);
    });
    rempl.ns('xxx').invoke('xxxtest', rempl.id + ' back ' + (idx++), function(res) {
        console.log('callback from provider.ns(xxx).xxxtest', res);
    });
}, 2000);

// ---- 

document.body.innerHTML = rempl.id + ' interface';
console.log('remote tool `' + rempl.id + '` inited');
