/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function(api) {
    var host;

    rempl.createEnv(parent, api.id, function(env) {
        host = env;
        env.connected.link(function(connected) {
            document.getElementById('env').hidden = !connected;
        });
        env.subscribe(function(data) {
            switch (data.type) {
                case 'DidChangeActivePaneItem':
                    if (data.pane.isEditor) {
                        document.getElementById('env').innerHTML += `<li><b>${data.host}:</b> ${data.pane.title} (${data.pane.grammar})</li>`;
                    }
                    break;
            }
        });
    });

    api.subscribe(function(counter) {
        document.getElementById('counter').innerHTML = counter;

        host.send({
            type: 'data',
            data: {
                type: 'setStatusBarContent',
                content: counter
            }
        });
    });

    window.reset = function() {
        api.callRemote('reset');
    };

    document.body
        .appendChild(document.createElement('div'))
        .innerHTML = `<ul hidden id="env"></ul>
          Counter:
          <b id="counter"></b>
          <button onclick="reset()">reset</button>`;
});
