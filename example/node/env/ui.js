/* eslint-env browser */
/* global rempl */

rempl.getSubscriber(function(api) {
    // api.subscribe(function(memoryUsage) {
    //     // sending memory usage to environment
    //     env.send({
    //         type: 'setStatusBarContent',
    //         content: memoryUsage
    //     });
    // });

    document.body
        .appendChild(document.createElement('div'))
        .innerHTML = '\
        <style>\
        body{\
            font-family: Helvetica, sans-serif;\
        }\
        </style>\
<div hidden id="env">\
    <div><b>Env name:</b> <span id="env-name">n/a</span></div>\
    <div><b>Active tab:</b> <span id="env-active-tab">n/a</span></div>\
    <div><b>File name:</b> <span id="env-file-name">n/a</span></div>\
    <div><b>Syntax:</b> <span id="env-active-syntax">n/a</span></div>\
    <hr/>\
    <div><b>Selections:</b></div>\
    <div id="env-selections"></div>\
    <hr/>\
    <div><b>Enter file name to open:</b></div>\
    <div>Examples:</div>\
    <ul>\
        <li><i>[path]</i> - just open</li>\
        <li><i>[path], [line]:[column]</i> - <b>open and set cursor to specified position</b></li>\
        <li><i>[path], [line]:[column], [line]:[column]</i> - <b>open and set cursor to specified positions (multi cursor)</b></li>\
        <li><i>[path], [line]:[column] - [line]:[column]</i> - <b>open and create selection on specified range</b></li>\
        <li><i>[path], [line]:[column] - [line]:[column], [line]:[column] - [line]:[column]</i> - <b>open and create selection on specified ranges (multi selection)</b></li>\
    </ul>\
    <input type="text" style="width: 200px" id="env-open-file-input">\
    <button id="env-open-file-button">Open file in env</button>\
    <span id="env-open-file-status"></span>\
    <hr/>\
    <div><b>Get content of current tab:</b></div>\
    <button id="env-get-content-button">Get it!</button>\
    <pre id="env-get-content-response"></pre>\
</div>\
<div id="no-env">No env detected...</div>\
';

    // refs to dom-nodes
    var env = api.env;
    var envElement = document.getElementById('env');
    var noEnv = document.getElementById('no-env');
    var envName = document.getElementById('env-name');
    var envTab = document.getElementById('env-active-tab');
    var envFileName = document.getElementById('env-file-name');
    var envSyntax = document.getElementById('env-active-syntax');
    var envOpenFileInput = document.getElementById('env-open-file-input');
    var envOpenFileButton = document.getElementById('env-open-file-button');
    var envOpenFileStatus = document.getElementById('env-open-file-status');
    var envGetContentButton = document.getElementById('env-get-content-button');
    var envGetContentResponse = document.getElementById('env-get-content-response');
    var envSelections = document.getElementById('env-selections');

    env.subscribe(function(data) {
        switch (data.type) {
            case 'hostInfo':
                envName.innerHTML = data.host.name + ' ' + data.host.version;
                envElement.hidden = false;
                noEnv.hidden = true;
                break;
            case 'activeTabChanged':
                if (data.tab.isEditor) {
                    envTab.innerHTML = data.tab.title;
                    envFileName.innerHTML = data.file.path || 'n/a';
                    envSyntax.innerHTML = data.file.syntax;
                }

                handleSelections(data.selections);
                break;
            case 'selectionChanged':
                envSelections.innerHTML = '';
                handleSelections(data.selections);
                break;
            case 'patchChanged':
                envFileName.innerHTML = data.path;
                break;
            case 'syntaxChanged':
                envSyntax.innerHTML = data.syntax;
                break;
        }
    });

    envOpenFileButton.addEventListener('click', function() {
        var parts = envOpenFileInput.value.split(',');
        var filePath = parts.splice(0, 1)[0];

        if (filePath) {
            var payload = {
                type: 'openFile',
                path: filePath
            };

            // normalize selections
            var selections = parts.map(function(range) {
                range = range.trim().split('-');

                var start = range[0].trim().split(':');
                var end = range[1] && range[1].trim().split(':') || [];

                return {
                    start: {
                        line: start[0],
                        column: start[1]
                    },
                    end: {
                        line: end[0],
                        column: end[1]
                    }
                };
            });

            if (selections && selections.length) {
                payload.selections = selections;
            }

            env.send(payload, function(response) {
                envOpenFileStatus.innerText = response.status ? 'opened' : 'not allowed';
            });
        }
    });

    envGetContentButton.addEventListener('click', function() {
        env.send({ type: 'getContent' }, function(response) {
            envGetContentResponse.innerText = response.status ? response.content : 'not allowed';
        });
    });

    function handleSelections(selections) {
        envSelections.innerHTML = '';

        if (selections) {
            selections.forEach(function(selection) {
                var selectionElement = document.createElement('div');
                var start = selection.start.line + ':' + selection.start.column;
                var end = selection.end.line + ':' + selection.end.column;

                selectionElement.textContent = start;

                if (start != end) {
                    selectionElement.textContent += ' - ' + end;
                }

                envSelections.appendChild(selectionElement);
            });
        }
    }
});
