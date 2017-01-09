## 1.0.0-alpha6 (January 9, 2016)

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
