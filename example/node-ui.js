/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function(api) {
    var theEnv;

    rempl.createEnv(parent, api.id, function(env) {
        theEnv = env;
        env.connected.link(function(connected) {
            document.getElementById('env').hidden = !connected;
        });
        env.subscribe(function(data) {
            switch (data.type) {
                case 'DidChangeActivePaneItem':
                    if (data.pane.isEditor) {
                        document.getElementById('env-active-tab').innerHTML = `<b>${data.host}:</b> ${data.pane.title} (${data.pane.grammar})`;
                    }
                    break;
            }
        });
    });

    api.subscribe(function(counter) {
        document.getElementById('counter').innerHTML = counter;

        if (theEnv) {
            theEnv.send({
                type: 'data',
                data: {
                    type: 'setStatusBarContent',
                    content: counter
                }
            });
        }
    });

    window.reset = function() {
        api.callRemote('reset');
    };

    document.body
        .appendChild(document.createElement('div'))
        .innerHTML = `<div hidden id="env">Editor active tab: <span id="env-active-tab"></span></div>
          Counter: <b id="counter"></b>
          <button onclick="reset()">reset</button>`;
});
