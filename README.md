[![NPM version](https://img.shields.io/npm/v/rempl.svg)](https://www.npmjs.com/package/rempl)
[![Build Status](https://github.com/rempl/rempl/actions/workflows/build.yml/badge.svg)](https://github.com/rempl/rempl/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/rempl/rempl/badge.svg?branch=master)](https://coveralls.io/github/rempl/rempl?branch=master)
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
  var myTool = rempl.createPublisher('myTool', function (settings, callback) {
    /* return a UI bundle or url */
  });

  // ...
</script>
```

By default publisher attempts to connect to WS server with the same `hostname` as page but `8177` as port. There are some options to specify rempl end point:

- using `<meta name="rempl:server" content="{rempl server host}">`:
  ```html
  <meta name="rempl:server" content="//1.2.3.4:1234" />
  <!-- or content="none" to disable connection to WS server -->
  ```
- using `ws` option on `Publisher` create:
  ```js
  new Publisher('name', function() { ... }, {
      ws: '//1.2.3.4:1234' // set false to disable connection to WS server
  });
  ```
- using `connectWS()` method of `Pulisher`'s instance
  ```js
  var myPublisher = new Publisher('name', function() { ... });
  myPublisher.connectWs('//1.2.3.4:1234')
  ```

### Node.js

```js
var rempl = require('rempl');
var myTool = rempl.createPublisher('myTool', function (settings, callback) {
  /* return a UI bundle or url */
});

// ...
```

When publisher is running on Node.js, it doesn't connect to WS server until WS server is not specified (there is no `location` object available like in browser's environment). There some options to specify server host:

- using environment variable `REMPL_SERVER` when start a script or before rempl is required for a first time. Example for MacOS:
  ```
  > REMPL_SERVER=//1.2.3.4:1234 node my-script.js
  ```
- using `ws` option on `Publisher` create:
  ```js
  new Publisher('name', function() { ... }, {
      ws: '//1.2.3.4:1234' // set false to disable connection to WS server
  });
  ```
- using `connectWS()` method of `Pulisher`'s instance
  ```js
  var myPublisher = new Publisher('name', function() { ... });
  myPublisher.connectWs('//1.2.3.4:1234')
  ```

## Overview

![[ subject ] <--- [ publisher (data) ] <--- rempl ---> [ subscriber (UI) ]](https://cloud.githubusercontent.com/assets/270491/21329597/8e5786c2-c64a-11e6-912f-12d8e8827c71.png)

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

- `script` – JavaScript bundle that includes everything is needed to build an UI (i.e. JavaScript, CSS, templates etc.). When `script` type is using, `rempl` injects itself before script evaluation. Therefore no need to include rempl source to subscriber.
- `url` – url of page subscriber. In this case `rempl` should be included to page by author.

## API

### Publisher

```js
var rempl = require('rempl');
var myTool = rempl.createPublisher('myTool', function (settings, callback) {
  callback(null, 'script', 'alert("myTool UI inited")');
});

setInterval(function () {
  myTool.publish(Date.now());
}, 1000);

myTool.provide({
  pong: function () {
    console.log('Remote subscriber invoke `pong`');
  },
});
```

- `publish(data)`
- `pipe(fn[, init])`
- `provide(methodName, fn)` or `provide(methods)`
- `isMethodProvided(method)`
- `revoke(methodName)` or `revoke(methodNamesArray)`
- `callRemote(method, ...args, callback)`
- `ns(namespace)`
  - publish/pipe/provide/revoke/isMethodProvided/callRemote

### Subscriber

```js
var myTool = rempl.getSubscriber();

myTool.subscribe(function (data) {
  console.log('Receive data from publisher:', data);

  myTool.callRemote('pong');
});
```

- `subscribe(callback)`
- `provide(methodName, fn)` or `provide(methods)`
- `isMethodProvided(methodName)`
- `revoke(methodName)` or `revoke(methodNamesArray)`
- `callRemote(methodName, ...args, callback)`
- `getRemoteMethod(methodName)`
- `isRemoteMethodExists(methodName)`
- `onRemoteMethodsChanged(callback)`
- `ns(namespace)`
  - subscribe/provide/revoke/isMethodProvided/callRemote

### Host

Rempl provides a host that can be injected right in the inspecting page, so called `in-page` host. To get that host use `rempl.getHost()` method.

```js
var inpageHost = rempl.getHost();

inpageHost.activate();
inpageHost.activate(publisherName);

inpageHost.deactivate();
inpageHost.deactivate(publisherName);
```

Host has two methods `activate()` and `deactivate()`.

- `activate([publisherName])` - uses to add host's view to page. When used with no argument method show UI and selects a first publisher. When argument is passed, it selects publisher with specified name.
- `deactivate([publisherName])` - hide host's view if it showed. When `publisherName` is passed, method deactivates view only if publisher with passed name is selected.

### RPC

Publishers and Subcribers can provide methods for remote side invocation and invoke methods of other side. API of both sides is symetric. Every namespace have the same RPC API as Publisher or Subscriber have.

> NOTE: Examples are given for a Publisher, but the same API is available for any Subscriber since API is symetric.

#### provide(methodName, fn)

Method to provide a method(s) for remote side. It allows to provide a single method or batch of methods.

```js
publisher.provide('foo', function () {
  console.log('Method `foo` was invoked by subscriber');
});
publisher.ns('something').provide({
  method1: function () {
    /* do something */
  },
  method2: function () {
    /* do something */
  },
});
```

#### revoke(methodName)

Method to revoke a method(s) that was provided before. It allows to revoke a single method or several methods at once.

```js
publisher.revoke('foo');
publisher.ns('something').revoke(['method1', 'method2']);
```

#### callRemote(methodName[, ...args][, callback])

Invoke remote side method with given arguments. All arguments should be a transferable through JSON data types, i.e. `number`, `string`, `boolean`, `Array`, plain object or null. The last argument can be a function that remote side can use to send data back.

```js
publisher.callRemote('methodName', 1, 2, function (res) {
  console.log('response from subscriber');
});
```

#### isMethodProvided(methodName)

Returns `true` when own method is provided for remote side by `provide()` method.

```js
publisher.isMethodProvided('test'); // false
publisher.provide('test', function () {});
publisher.isMethodProvided('test'); // true
publisher.revoke('test');
publisher.isMethodProvided('test'); // false
```

#### isRemoteMethodExists(methodName)

Returns `true` when remote method is available to be invoked.

> Currently method doesn't work for publisher since there can be several subscribers with different method set provided.

```js
if (subscriber.isRemoteMethodExists('test')) {
  subscriber.callRemote('test');
}
```

#### onRemoteMethodsChanged(callback)

Allows to subscribe to remote side API state of namespace. Method invoke passed callback on subscription and return a function to unsubscribe.

> Currently method doesn't work for publisher since there can be several subscribers with different method set provided.

```js
var unsubscribeDefaultNsMethodsLogging = subscriber.onRemoteMethodsChanged(function (methods) {
  console.log(methods);
});

// call returned function when need to stop listen for API changes
unsubscribeDefaultNsMethodsLogging();
```

#### getRemoteMethod(methodName)

Returns a function that invokes `callRemote` with specified `methodName`. This function is context free (namespace is binded) and invokes `callRemote` only when remote method is available, otherwise it outputs a warning. `available` property of function can be used to check a remote method is available.

> Currently method doesn't work for publisher since there can be several subscribers with different method set provided.

```js
var fooMethod = subscriber.getRemoteMethod('foo');
var nsBarBazMethod = subscriber.ns('bar').getRemoteMethod('baz');

if (fooMethod.available) {
  fooMethod(1, 2, 3);
}

nsBarBazMethod();
// with no check a warning message might to be outputed
```
