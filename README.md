[![NPM version](https://img.shields.io/npm/v/rempl.svg)](https://www.npmjs.com/package/rempl)

The general idea behind `Rempl` is to simplify moderated remote access to JavaScript runtime. `Rempl` provides a transport between environments and a set of UI hosts.

##


![\[ subject \] <--- \[ publisher (data) \] <--- rempl ---> \[ subscriber (UI) \]](https://cloud.githubusercontent.com/assets/270491/21027773/6a737c16-bda3-11e6-82c5-f0c0ef8ba00e.png)

## API

### Publisher

```js
var createRemplPublisher = require('rempl');
var myTool = createRemplPublisher('myTool', function(settings, callback) {
    callback(null, 'script', 'alert("myTool UI inited")');
}, 'ws://localhost:8177');

setInterval(function() {
    myTool.publish('ping');
});

myTool.define({
    pong: function() {
        console.log('Remote subscriber invoke `pong`');
    }
});
```

- publish(data)
- define(methods)
- hasMethod(method)
- invoke(method, ...args, callback)
- ns(namespace)
  - publish/define/hasMethod/invoke

### Subscriber

```js
rempl.subscribe(function(data) {
    console.log('Receive data from publisher:', data);

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

- `session` - remote inspector for ui connections
- `connected` - flag to represent a state of a connection to the remote end point (dev-server or Developer Tools in a browser)
- `features` - list of available feature hosts
