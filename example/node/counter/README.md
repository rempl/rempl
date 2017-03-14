## Node.js: Simple counter

### Usage

Start publisher:
> node index.js

Open rempl-server page in you browser ([http://localhost:8177/](http://localhost:8177/) by default) and choose `counter`-publisher.

The counter is receiving from node-publisher and displays to the UI. Press the `reset`-button to reset counter in the publisher.

### How it works

Subscribing to the publisher data and displaying received counter value. `reset`-button calls remote `reset`-method that is provided by the publisher.

<img src="https://cloud.githubusercontent.com/assets/6654581/23896920/384fe60c-08bc-11e7-9b12-e4dd62e44e3e.gif" width="500px"/>
