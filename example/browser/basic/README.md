## Browser: Simple counter

### Usage

Make sure dependencies are installed and rempl is built.

```
npm install && npm run build
```

Start any http-server in project's root and open `example/basic/index.html` in your browser.

Start [`rempl` server](https://github.com/rempl/rempl-cli), open its host in your browser([http://localhost:8177/](http://localhost:8177/) by default) and choose `example-basic`-publisher.

UI display current publisher date and time.	

### How it works

Subscribing to the publisher data and displaying received value. Publisher is publishing its date and time every second.

<img src="https://cloud.githubusercontent.com/assets/6654581/23925939/a0341cbe-0922-11e7-8979-02ac28c69d14.gif" width="500px"/>
