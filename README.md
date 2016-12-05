The general idea behide `Rempl` in simplifying moderate remote access to JavaScript runtime. It provides transport between environments and set of hosts for UIs.

##

```
[ runtime ] <--- [ provider (data) ] <--- rempl ---> [ customer (UI) ]
```

## API

### Provider

```js
var createRemplProvider = require('rempl');
var myTool = createRemplProvider('myTool', function(settings, callback) {
    callback(null, 'script', 'alert("myTool UI inited")');
}, 'ws://localhost:8177');

setInterval(function() {
    myTool.send('ping');
});

myTool.define({
    pong: function() {
        console.log('Remote customer invoke `pong`');
    }
});
```

- send(data)
- define(methods)
- hasMethod(method)
- invoke(method, ...args, callback)
- ns(namespace)
  - send/define/hasMethod/invoke

### Customer

```js
rempl.subscribe(function(data) {
    console.log('Recieve data from provider:', data);

    rempl.invoke('pong');
});
```

- subscribe(callback)
- define(methods)
- hasMethod(method)
- invoke(method, ...args, callback)
- ns(namespace)
  - subscribe/define/hasMethod/invoke

---

- `session` - remote inspector ui connections
- `connected` - flag to represent connection state to remote end point (dev-server, browser's developer tools)
- `features` - available host feature list
