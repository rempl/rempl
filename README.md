[![NPM version](https://img.shields.io/npm/v/rempl.svg)](https://www.npmjs.com/package/rempl)

The general idea behind `Rempl` is to simplify moderated remote access to JavaScript runtime. `Rempl` provides a transport between environments and a set of UI hosts.

## Install

```
npm install rempl
```

## Usage

### Browser

```html
<script src="node_modules/rempl/dist/rempl.js"></script>
<script>
    var myTool = rempl.createPublisher('myTool', function() { /* ... */ });

    // or

    rempl.getSubscriber(function(myTool) {
        // build UI and subscribe for data from publisher
    });
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

- `Subject` – something to be inspected, i.e. app, page, environment etc
- `Publisher` – monotors a `subject`, collect a data and publish it for `subscribers`
- `Subscriber` – consumer of `publisher`'s data, provide an UI for recieved data
- `Transport` – channels and protocols between `publisher` and `subscriber`; WebSocket (socket.io) or DOM Event-based communication may to be used between endpoints
- `Host` – integration to integrates in some environment (app), allows to choose a publisher and creates a `sandbox` for its `subscriber`; usually it's a plugin for something like browsers, editors etc
- `Sandbox` – creates a `subscriber`, request an UI and activate it when recieved

Publisher and subscriber are two parts of single app (tool). Transports, hosts and sandboxes are parts of `rempl`.

### Server

For most cases you need a WebSocket transport. In this case a WS server required. Rempl provides 

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

For tools based on `rempl`, a publisher is source of UI. When new sandbox for subscriber is created it send a request to publisher to provide an UI. Publisher should provide UI in some way:

- `script` – JavaScript bundle that includes everything need to build an UI (i.e. JavaScript, CSS, templates etc)
- `url` (in progress) – url of page that contains publishers UI

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
rempl.getSubscriber(function(myTool) {
    myTool.subscribe(function(data) {
        console.log('Receive data from publisher:', data);

        myTool.invoke('pong');
    });
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
