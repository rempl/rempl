/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function(api) {
    document.body
        .appendChild(document.createElement('div'))
        .innerHTML = `
<div hidden id="env">
    <div><b>Env name:</b> <span id="env-name">n/a</span></div>
</div>
<div id="no-env">No env detected...</div>
<div><b>Publisher memory usage:</b> <span id="memory-usage">n/a</span></div>
`;

    // refs to dom-nodes
    var env = rempl.createEnv(parent, api.id);
    var envElement = document.getElementById('env');
    var noEnvElement = document.getElementById('no-env');
    var envNameElement = document.getElementById('env-name');
    var memoryUsageElement = document.getElementById('memory-usage');

    env.subscribe(function(data) {
        switch (data.type) {
            case 'hostInfo':
                envNameElement.innerHTML = `${data.host.name} ${data.host.version}`;
                envElement.hidden = false;
                noEnvElement.hidden = true;
        }
    });

    api.subscribe(function(memoryUsage) {
        memoryUsageElement.innerHTML = memoryUsage;

        // sending memory usage to environment
        env.send({
            type: 'data',
            data: {
                type: 'setStatusBarContent',
                content: memoryUsage
            }
        });
    });
});
