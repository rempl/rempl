## Node.js: Environment active tab info

### Usage

Start publisher:
> node index.js

Open rempl-client in one of supported hosts (e.g. [Atom](https://atom.io/packages/rempl-host)) and choose `env-active-tab`-publisher.

Try to switch the tabs in your editor and example UI must display active tab info.

### How it works

Subscribing to the environment-events:
* `hostInfo` - comes when subscriber is connected to the host
* `activeTabChanged` - comes when changed the active tab in the host

![image](https://cloud.githubusercontent.com/assets/6654581/23856848/1608c114-080c-11e7-9741-f9afda10f21d.png)

