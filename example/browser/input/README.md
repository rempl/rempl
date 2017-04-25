## Browser: Simple counter

### Usage

Make sure dependencies are installed and rempl is built.

```
npm install && npm run build
```

Start any http-server in project's root and open `example/input/index.html` in your browser.

Start [`rempl` server](https://github.com/rempl/rempl-cli), open its host in your browser([http://localhost:8177/](http://localhost:8177/) by default) and choose `web-input`-publisher.

The value is receiving from web page-publisher and displays to the UI. Just change the input value in the publisher and look at the UI.

### How it works

Subscribing to the publisher data and displaying received counter value. Publisher is publishing the data every time when input-field value is changed.

<img src="https://cloud.githubusercontent.com/assets/6654581/23896931/4641ac14-08bc-11e7-8f12-516aae853183.gif" width="500px"/>
