## Environment: Watching selections 

### Usage

Start publisher:
> node index.js

Open rempl-client in one of supported hosts (e.g. [Atom](https://atom.io/packages/rempl-host)) and choose `env-watch-selections`-publisher.

Try to changing the selections or cursor position in your editor and UI will display this changes.

### How it works

Subscribing to the environment-events:
* `hostInfo` - comes when subscriber is connected to the host
* `activeTabChanged` - comes when changed the active tab in the host
* `selectionChanged` - comes when selections or cursor position was changed

<img src="https://cloud.githubusercontent.com/assets/6654581/24004834/70b5dc8c-0a78-11e7-8d93-ca1c1f3736b1.gif" width="500px"/>


