## next

- Rewitten into TypeScript and related refactoring
- Converted into dual package, i.e. ESM and CommonJS are supported
- Changed dist:
  - `/dist/rempl.js` – IIFE bundle that's adding `rempl` to global
  - `/dist/rempl.esm.js` – ESM bundle
- Removed callback support for `getSubscriber()` which was deprecated in `1.0.0-alpha14`
- Removed `PublisherNamespace#pipe()` method
- Changed `createPublisher()` to return an existing publisher instead of `null` when a publisher with provided id is already exist
- Added second argument `includeRempl` to `scriptFromFile()` to prepend rempl source to file's content
- Added support for promise based API in `Namespace#provide()` and `Namespace#callRemote()` methods, using callbacks is deprecated:
  - `ns.provide('method', callback => callback(value))` -> `ns.provide('method', () => value)` or `ns.provide('method', () => Promise.resolve(value))`
  - `ns.callRemote('method', value => console.log(value))` -> `ns.callRemote('method').then(value => console.log(value))`
- Added `getSelfSubscriber(id)`

## 1.0.0-alpha.19 (November 10, 2017)

- Added `browser` field to `package.json` to fix build issue with webpack (@restrry, #18)

## 1.0.0-alpha.18 (October 25, 2017)

- Fixed warning about wrong URI when default settings is used and no explicit host is set
- Added `auto` value as alias for `implicit` for publisher connection settings

## 1.0.0-alpha17 (October 18, 2017)

- Fixed wrong dist version published

## 1.0.0-alpha16 (October 1, 2017)

- Added `Endpoint#getRemoteMethod()` method
- Added `PublisherNamespace#pipe()` method
- Rework publisher's behaviour for connection to WS server (implicit/explicit and more options)
  - Browser's version
    - Renamed attribute `value` to `content` in `<meta name="rempl:server">`
    - Added `implicit` value support to `<meta name="rempl:server">`
    - Added support for `REMPL_SERVER` non-global variable in scope (priority over `<meta>` when not an `undefined`). Can be `'none'`/`false`, `'implicit'`/`true` or any string (treat as url)
    - no connection to ws server by default
  - Node's version
    - Added new values for `REMPL_SERVER`: `false` (equals to `'none'`), `'implicit'`, `true` (equals to `'implicit'`)
  - Common
    - Changed `ws` option on publisher creation to allow values: `'implicit'`/`true`, `'explicit'`/`undefined`, `false` or any string
    - Changed `Publisher#connectWs()` to have a special meaning for `undefined`/`'implicit'` and `'explicit'`
- Updated `socket.io-client` to `^2.0.2` and used its slim version (reduce dist size 115Kb -> 94Kb)
- Fixed known issues with bundle working in various environments
- Fixed bugs in Safari

## 1.0.0-alpha15 (April 11, 2017)

- Improved WS transport setup
  - Don't use WS transport for publisher when default URI is `none` and `options.ws` is not specified
  - Don't use WS transport for publisher when `options.ws` is not a string or falsy
  - Implemented `Publisher#connectWs()` method to connect publisher to specific WS origin
  - Improved WS origin resolving to work better for https/wss
- Reduced `connect` packets count on event transports connection
- Implemented publisher auto-selection when in-page host activated with no specified publisher and no available publishers, first publisher will be selected when available
- Fixed callback broadcasting for event transport, response is now sending to `callRemote` initiator only
- Fixed `EndpointList` check for new/old list difference
- Fixed connection with env for `url` subscribers

## 1.0.0-alpha14 (April 7, 2017)

### Core

- Fixed false positive `utils.isNode` for `Electron` apps

#### Endpoint

- Implemented `EndpointList` and `EndpointListSet` helper classes
- Implemented `Endpoint#id`
- Implemented `Endpoint#remoteEndpoints` property which contains all remote endpoint ids connected via any transport
- Implemented `Endpoint#connected` which is `true` when `Endpoint#remoteEndpoints` list contains a `Endpoint#id` value
- Improved `Endpoint#getName()` to return endpoint name with id if any

#### Publisher

- Reworked `Publisher` to be abstract, move all client specifics (like `getRemoteUI` method) to publisher factory

#### Subscriber

- Changed `rempl.getSubscriber()` to return a subscriber, using a callback is deprecated now
- Reworked `Subscriber` to be abstract, move all client specifics (like disconnection overlay) to subscriber factory
- Removed `publisher:connect` and `publisher:disconnect` event handling by `Subscriber`, it became redundant due to `Enpoint#connected`

#### Env

- `Env` is now based on pub/sub model, `Publisher` and `Subscriber` are used under the hood
- Implemented `rempl.createEnv(name)` to create an env publisher
- Implemented `rempl.getEnv(name)` to get an env subscriber
- Removed `Subscriber#env` and related

#### EventTransport

- Improved protocol to work in case when several transport with the same name is connecting to each other
- Implemented `Transport.get()` to re-use transports
- Various internal improvements

#### Host

- Fixed re-inserting for in-page host view on publisher changing

### WS Server Client

- Show publisher name as page title in exclusive mode

## 1.0.0-alpha13 (March 30, 2017)

- Implemented `rempl.source` that contains source or rempl itself (like a [quine](<https://en.wikipedia.org/wiki/Quine_(computing)>))
- Implemented `rempl.version`
- Implemented in-page host. It may be activated via `rempl.getHost().activate(publisherId)` and deactivated via `rempl.getHost().deactivate(publisherId)` or `rempl.getHost().deactivate()`
- Reworked `Sandbox`
  - Removed `rempl.initSandbox()`
  - Implemented `rempl.createSandbox(settings, onInit)`
  - From now publisher's `rempl` version for `script` type subscribers is used instead of process that creates a sandbox
- Initial refactoring of `Env`
  - Removed `rempl.createEnv()`
  - Implemented `Subscriber#env` to provide an access to env interface
  - Implemented `env.enabled` and link env with sandbox only when env is enabled
- Reworked event transport to use own and remote endpoint lists. Currently it has a limited usage of these lists, in future it will be used for better traffic filter.
- Fixed `Publisher`'s WS transport sync when multiple publishers is used
- Excluded dev version of ws server UI from `npm` package, so `rempl-cli` is always use `prod` version when `rempl` installed from `npm`
- Various small fixes and improvements

## 1.0.0-alpha12 (March 26, 2017)

- Fixed exception on publisher init in browser
- Fixed `Namespace#provide()` method to not define methods when map of methods is passed

## 1.0.0-alpha11 (March 24, 2017)

- Implemented basic integration with host environment
- Implemented remote methods synchronization
  - Added `SubscriberNamespace#onRemoteMethodsChanged()` method
- Implemented `Subscriber#connected` property (a Token instance) to indicate publisher is connected
- Implemented default subscriber overlay on publisher connection losing (set `subscriber.connected.defaultOverlay` to `false` to disable it)
- Improved publisher connection tracking and reconnection in WS server
- Improved `scriptFromFile` to use cache and `settings.dev` option
- Make possible manual sync for `Publisher` on node.js as temporary solution
- Implemented exclusive publisher mode in WS server by setting `exclusivePublisher` option

## 1.0.0-alpha10 (March 3, 2017)

- Fixed sandbox showing issue in server client

## 1.0.0-alpha9 (March 3, 2017)

- Fixed npm publishing issue (some files of server client UI doesn't publish)

## 1.0.0-alpha8 (March 3, 2017)

- Fixed npm publishing issue (server client UI doesn't publish)

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
- Fixed fetching publisher name from URL in server client UI (@smelukov, #7)

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
