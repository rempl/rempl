## 1.0.0-alpha7 (March 3, 2017)

### Core

- Implemented `Endpoint` class as base class for `Publisher` and `Subscriber`
- Implemented `Namespace` class for channels and change RPC API
    - Renamed `define()` method to `provide()`
    - Implemented additional semantic for `provide()` method (i.e. `provide('name', function() { .. })`)
    - Changed behaviour of `provide()` method to override already provided methods
    - Implement `revoke()` method to revoke provided methods
    - Renamed `hasMethod()` method to `isMethodProvided()`
    - Renamed `invoke()` method to `callRemote()`
    - Made callback call safe when callback is not pass to remote method
- Changed `Token` API
    - Implemented `get()` method
    - Implemented `link()` method
    - Renamed `attach()` method to `on()`
    - Renamed `detach()` method to `off()`
- Removed `features` feature

### WS Server

- Prevented inclusion `rempl.js` in `ws.js` by default
- Reworked transport protocol

### WS Server Client

- Fixed initialization of publisher UI with type `script`
- Made pick a subscriber button toggable
- Fixed ecode publisher name from URL in server client UI (@smelukov, #7)

## 1.0.0-alpha6 (January 9, 2017)

- Added `url` UI type support
- Set proper server web interface viewport size on mobile devices

## 1.0.0-alpha5 (December 21, 2016)

- Fixed `404` for rempl script in server sandbox
- Fixed publisher's UI init issue when script doesn't end with semicolon
- Fixed issue with auto init on subscribe in case of multiple namespaces

## 1.0.0-alpha4 (December 21, 2016)

- Added standalone mode to server (required for [`rempl-cli`](https://github.com/rempl/rempl-cli))
- Added new ways to setup `rempl` WebSocket server endpoint: `process.env.REMPL_SERVER` for node.js (`localhost:8177` is using if not set) and `<meta name="rempl:server" value="..">` for browser environment (`[hostname]:8177` or `localhost:8177` are using if not set)
- Publisher is using its own WebSocket transport in browser environment now
- Reworked event transport to use `postMessage` instead of `CustomEvent`
- Reworked communication between sandbox and subscriber. Direct access between runtimes isn't required anymore (event transport is using)
- Implemented `rempl.initSandbox(win, name, callback)` method
- Implemented `rempl.scriptUiFromFile(path)` method
- Implemented naive solution for auto-init on `Namespace#subscribe()`
- Chromium extension host was extracted to separate [repo](https://github.com/rempl/host-chromium-extension)
- Various bug fixes and improvements
