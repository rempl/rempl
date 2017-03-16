## Environment: Watching active tab

### Usage

Start publisher:
> node index.js

Open rempl-client in one of supported hosts (e.g. [Atom](https://atom.io/packages/rempl-host)) and choose `env-active-tab`-publisher.

Try to switch the tabs in your editor and example UI must display active tab info.

### How it works

Subscribing to the environment-events:
* `hostInfo` - comes when subscriber is connected to the host
* `activeTabChanged` - comes when changed the active tab in the host

<img src="https://cloud.githubusercontent.com/assets/6654581/23896819/c6c134c8-08bb-11e7-879b-7f625c9c7408.gif" width="500px"/>


