[![NPM version](https://img.shields.io/npm/v/rempl.svg)](https://www.npmjs.com/package/rempl)
[![Build Status](https://travis-ci.org/rempl/rempl.svg?branch=master)](https://travis-ci.org/rempl/rempl)
[![Twitter](https://img.shields.io/badge/Twitter-@rempljs-blue.svg)](https://twitter.com/rempljs)

The general idea behind `Rempl` is to simplify moderated remote access to JavaScript runtime. `Rempl` provides a transport between environments and a set of UI hosts.

## Examples

Built on `Rempl`:

- [shower-remote-control](https://github.com/lahmatiy/shower-remote-control) – [Shower](https://github.com/shower/shower) plugin for remote controlling of presentation
- [webpack-runtime-analyzer](https://github.com/smelukov/webpack-runtime-analyzer) – [Webpack](https://github.com/webpack/webpack) plugin for analyzing internal processes, state and structure of bundles

## Install

```
npm install rempl
```

## How to use

### Browser

```html
<script src="node_modules/rempl/dist/rempl.js"></script>
<script>
    var myTool = rempl.createPublisher('myTool', function() { /* ... */ });

    // ...
</script>
```

### Node.js

```js
var rempl = require('rempl');
var myTool = rempl.createPublisher('myTool', function() { /* ... */ });

// ...
```

## Overview

![\[ subject \] <--- \[ publisher (data) \] <--- rempl ---> \[ subscriber (UI) \]](https://cloud.githubusercontent.com/assets/270491/21329597/8e5786c2-c64a-11e6-912f-12d8e8827c71.png)

- `Subject` – something to be inspected, i.e. app, page, environment etc.
- `Publisher` – monitors a `subject`, collects data and publishes it for `subscribers`
- `Subscriber` – consumer of `publisher`'s data, provides an UI for received data
- `Transport` – channels and protocols between `publisher` and `subscriber`; WebSocket (socket.io) or DOM Event-based communication may to be used between endpoints
- `Host` – integrates in some environment (app), allows to choose a publisher and creates a `sandbox` for its `subscriber`; usually it's a plugin for something like browser, editor etc.
- `Sandbox` – creates a `subscriber`, request an UI and activate it when received

Publisher and subscriber are two parts of single app (tool). Transports, hosts and sandboxes are parts of `rempl`.

### Server

For most cases you need a WebSocket transport. In this case a WS server is required. Rempl provides

- [rempl-cli](https://github.com/rempl/rempl-cli) – command line app to launch a server
- [menubar-server](https://github.com/rempl/menubar-server) – an Electron app that launchs an `rempl` server instance and provide easy control over it; allows forget about command line

### Host

`Rempl` server provides web interface to monitor list of publishers and to launch selected publisher's UI in sandbox. Just open server's origin (by default `http://localhost:8177`) in your browser.

- Browsers
  - [Google Chrome](https://chrome.google.com/webstore/detail/rempl/hcikjlholajopgbgfmmlbmifdfbkijdj) [[repo](https://github.com/rempl/host-chromium-extension)]
  - Firefox (planned)
- Editors
  - [Atom](https://atom.io/packages/rempl) [[repo](https://github.com/rempl/host-atom)]
  - VS Code (planned)

### Publisher environment

Publisher doesn't depends hard on environment. It's mostly limited by transports allowed to process. Currently `rempl` publisher works well in:

- Browser's regular page
- Node.js process

Planned (not tested yet):

- WebWorker
- ServiceWorker

> Publisher can theoretically be created in non-JavaScript environment. In this case [publisher](https://github.com/rempl/rempl/blob/master/src/publisher/Publisher.js) interface and socket.io client should be implemented in language you use.

### Distribution of UI

For tools based on `rempl`, a publisher is a source of UI. When new sandbox for subscriber is created, it sends a request to publisher to provide an UI. Publisher should provide UI in some way:

- `script` – JavaScript bundle that includes everything is needed to build an UI (i.e. JavaScript, CSS, templates etc.)
- `url` – url of page that contains publishers UI

## API

### Publisher

```js
var rempl = require('rempl');
var myTool = rempl.createPublisher('myTool', function(settings, callback) {
    callback(null, 'script', 'alert("myTool UI inited")');
});

setInterval(function() {
    myTool.publish('ping');
});

myTool.provide({
    pong: function() {
        console.log('Remote subscriber invoke `pong`');
    }
});
```

- publish(data)
- provide(methodName, fn) or provide(methods)
- revoke(methodName) or provide(methodNamesArray)
- isMethodProvided(method)
- callRemote(method, ...args, callback)
- ns(namespace)
  - publish/provide/isMethodProvided/callRemote

### Subscriber

```js
rempl.getSubscriber(function(myTool) {
    myTool.subscribe(function(data) {
        console.log('Receive data from publisher:', data);

        myTool.callRemote('pong');
    });
});
```

- subscribe(callback)
- provide(methodName, fn) or provide(methods)
- revoke(methodName) or provide(methodNamesArray)
- isMethodProvided(method)
- callRemote(method, ...args, callback)
- ns(namespace)
  - subscribe/provide/isMethodProvided/callRemote

### RPC

Publishers and Subcribers can provide methods for remote side invocation and invoke methods of other side. API of both sides is symetric. Every namespace have the same RPC API as Publisher or Subscriber have.

> NOTE: Examples are given for a Publisher, but the same API is available for any Subscriber since API is symetric.

#### provide()

Method to provide a method(s) for remote side. It has two semantic: to provide a single method or batch of methods.

```js
publisher.provide('foo', function() {
    console.log('Method `foo` was invoked by subscriber');
});
publisher.ns('something').provide({
    method1: function() { /* do something */ },
    method2: function() { /* do something */ }
});
```

#### revoke()

Method to revoke a method(s) that was provided before. It allows to revoke a single method or several methods at once.

```js
publisher.remove('foo');
publisher.ns('something').revoke(['method1', 'method2']);
```

#### isMethodProvided()

Returns `true` when method is provided for remote side by `provide()` method.

```js
publisher.isMethodProvided('test'); // false
publisher.provide('test', function() {});
publisher.isMethodProvided('test'); // true
publisher.revoke('test');
publisher.isMethodProvided('test'); // false
```

#### callRemote()

Invoke remote side method with given arguments. All arguments should be a transferable through JSON data types, i.e. `number`, `string`, `boolean`, `Array`, plain object or null. The last argument can be a function that remote side can use to send data back.

```js
publisher.callRemote('methodName', 1, 2, function(res) {
    console.log('response from subscriber');
});
```

---

- `session` - remote inspector for ui connections
- `connected` - flag to represent a state of a connection to the remote end point (dev-server or Developer Tools in a browser)
- `features` - list of available feature hosts
