/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function() {
    document.body
        .appendChild(document.createElement('div'))
        .innerHTML = '\
<div hidden id="env">\
    <div><b>Env name:</b> <span id="env-name">n/a</span></div>\
    <div><b>Editor active tab:</b> <span id="env-active-tab">n/a</span></div>\
    <div><b>Grammar:</b> <span id="env-active-grammar">n/a</span></div>\
</div>\
<div id="no-env">No env detected...</div>\
';

    // refs to dom-nodes
    var env = rempl.createEnv(parent);
    var envElement = document.getElementById('env');
    var noEnvElement = document.getElementById('no-env');
    var envNameElement = document.getElementById('env-name');
    var activeTabElement = document.getElementById('env-active-tab');
    var activeGrammarElement = document.getElementById('env-active-grammar');

    env.subscribe(function(data) {
        switch (data.type) {
            case 'hostInfo':
                envNameElement.innerHTML = data.host.name + ' ' + data.host.version;
                envElement.hidden = false;
                noEnvElement.hidden = true;
                break;
            case 'activeTabChanged':
                if (data.tab.isEditor) {
                    activeTabElement.innerHTML = data.tab.title;
                    activeGrammarElement.innerHTML = data.file.grammar;
                }
        }
    });
});
