/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function() {
    document.body
        .appendChild(document.createElement('div'))
        .innerHTML = '\
<div hidden id="env">\
    <div><b>Env name:</b> <span id="env-name">n/a</span></div>\
    <div><b>File name:</b> <span id="env-file-name">n/a</span></div>\
    <div><b>Selections:</b></div>\
    <div id="env-selections"></div>\
</div>\
<div id="no-env">No env detected...</div>\
';

    // refs to dom-nodes
    var env = rempl.createEnv(parent);
    var envElement = document.getElementById('env');
    var noEnvElement = document.getElementById('no-env');
    var envNameElement = document.getElementById('env-name');
    var envFileNameElement = document.getElementById('env-file-name');
    var envSelectionsElement = document.getElementById('env-selections');

    env.subscribe(function(data) {
        switch (data.type) {
            case 'hostInfo':
                envNameElement.innerHTML = data.host.name + ' ' + data.host.version;
                envElement.hidden = false;
                noEnvElement.hidden = true;
                break;
            case 'activeTabChanged':
                if (data.tab.isEditor) {
                    envFileNameElement.innerHTML = data.file.path || 'n/a';
                }

                handleSelections(data.selections);
                break;
            case 'selectionChanged':
                envSelectionsElement.innerHTML = '';
                handleSelections(data.selections);
                break;
        }
    });

    function handleSelections(selections) {
        envSelectionsElement.innerHTML = '';

        if (selections) {
            selections.forEach(function(selection) {
                var selectionElement = document.createElement('div');
                var start = selection.start.line + ':' + selection.start.column;
                var end = selection.end.line + ':' + selection.end.column;

                selectionElement.textContent = start;

                if (start != end) {
                    selectionElement.textContent += ' - ' + end;
                }

                envSelectionsElement.appendChild(selectionElement);
            });
        }
    }
});
