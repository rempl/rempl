## Node.js: Sending memory usage to environment

### Usage

Start publisher:
> node index.js

Open rempl-client in one of supported hosts (e.g. [Atom](https://atom.io/packages/rempl-host)) and choose `env-memory-usage`-publisher.
 
Just watch current memory usage info from publisher in your editor.

### How it works

Subscribing to the `hostInfo` environment-event and sending data from publisher to the environment.

![image](https://cloud.githubusercontent.com/assets/6654581/23857790/79c99efa-080f-11e7-98a3-8924966562bd.png)
