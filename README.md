The general idea behide `Rempl` in simplifying remote access to JavaScript runtime. It provides transport between environments and set of hosts for UIs.

##

```
[ provider ] <--- rempl ---> [ customer (UI) ]
```

## API

### Provider

```js
var createRemplProvider = require('rempl');
var myTool = createRemplProvider('myTool', function(settings, callback) {
    callback(null, 'script', 'alert("myTool UI inited")');
}, 'ws://localhost:8888');

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
- subscribe(callback)
- define(methods)
- invoke(method, ...args, callback)
- ns(namespace)
  - send/subscribe/define/invoke

### Customer

- send(data)
- subscribe(callback)
- define(methods)
- invoke(method, ...args, callback)
- ns(namespace)
  - send/subscribe/define/invoke

---

- `session` - remote inspector ui connections
- `connected` - flag to represent connection state to remote end point (dev-server, browser's developer tools)
- `features` - available host feature list
