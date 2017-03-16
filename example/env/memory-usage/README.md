## Environment: Sending memory usage from publisher to environment

### Usage

Start publisher:
> node index.js

Open rempl-client in one of supported hosts (e.g. [Atom](https://atom.io/packages/rempl-host)) and choose `env-memory-usage`-publisher.
 
Just watch current memory usage info from publisher in your editor.

### How it works

Subscribing to the `hostInfo` environment-event and sending data from publisher to the environment.

<img src="https://cloud.githubusercontent.com/assets/6654581/23896912/21cdfd60-08bc-11e7-8de2-1a0e39fa0694.gif" width="500px"/>
