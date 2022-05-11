/* eslint-env browser */
/* global rempl */

// api.subscribe(function(memoryUsage) {
//     // sending memory usage to environment
//     env.send({
//         type: 'setStatusBarContent',
//         content: memoryUsage
//     });
// });

document.body.appendChild(document.createElement('div')).innerHTML = `
    <style>
    body{
        font-family: Helvetica, sans-serif;
    }
    </style>
    <div hidden id="env">
    <div><b>Env name:</b> <span id="env-name">n/a</span></div>
    <div><b>Active tab:</b> <span id="env-active-tab">n/a</span></div>
    <div><b>File name:</b> <span id="env-file-name">n/a</span></div>
    <div><b>Syntax:</b> <span id="env-active-syntax">n/a</span></div>
    <hr/>
    <div><b>Selections:</b></div>
    <div id="env-selections"></div>
    <hr/>
    <div><b>Enter file name to open:</b></div>
    <div>Examples:</div>
    <ul>
        <li><i>[path]</i> - just open</li>
        <li><i>[path], [line]:[column]</i> - <b>open and set cursor to specified position</b></li>
        <li><i>[path], [line]:[column], [line]:[column]</i> - <b>open and set cursor to specified positions (multi cursor)</b></li>
        <li><i>[path], [line]:[column] - [line]:[column]</i> - <b>open and create selection on specified range</b></li>
        <li><i>[path], [line]:[column] - [line]:[column], [line]:[column] - [line]:[column]</i> - <b>open and create selection on specified ranges (multi selection)</b></li>
    </ul>
    <input type="text" style="width: 200px" id="env-open-file-input">
    <button id="env-open-file-button">Open file in env</button>
    <span id="env-open-file-status"></span>
    <hr/>
    <div><b>Get content of current tab:</b></div>
    <button id="env-get-content-button">Get it!</button>
    <pre id="env-get-content-response"></pre>
    </div>
    <div id="no-env">No env detected...</div>
`;

// refs to dom-nodes
const env = rempl.getEnv('editor');
const envElement = document.getElementById('env');
const noEnv = document.getElementById('no-env');
const envName = document.getElementById('env-name');
const envTab = document.getElementById('env-active-tab');
const envFileName = document.getElementById('env-file-name');
const envSyntax = document.getElementById('env-active-syntax');
const envOpenFileInput = document.getElementById('env-open-file-input');
const envOpenFileButton = document.getElementById('env-open-file-button');
const envOpenFileStatus = document.getElementById('env-open-file-status');
const envGetContentButton = document.getElementById('env-get-content-button');
const envGetContentResponse = document.getElementById('env-get-content-response');
const envSelections = document.getElementById('env-selections');

env.subscribe((data) => {
    envName.innerHTML = data.name + ' ' + data.version;
    envElement.hidden = false;
    noEnv.hidden = true;
});
env.ns('activeTab').subscribe((data) => {
    if (data && data.isEditor) {
        envTab.innerHTML = data.title;
        envFileName.innerHTML = data.file.path || 'n/a';
        envSyntax.innerHTML = data.file.syntax;
    } else {
        envTab.innerHTML = '-';
        envFileName.innerHTML = '-';
        envSyntax.innerHTML = '-';
    }

    handleSelections(data && data.selections);
});

envOpenFileButton.addEventListener('click', () => {
    const parts = envOpenFileInput.value.split(',');
    const filePath = parts.splice(0, 1)[0];

    if (filePath) {
        // normalize selections
        let selections = parts.map((range) => {
            range = range.trim().split('-');

            const start = range[0].trim().split(':');
            const end = (range[1] && range[1].trim().split(':')) || [];

            return {
                start: {
                    line: start[0],
                    column: start[1],
                },
                end: {
                    line: end[0],
                    column: end[1],
                },
            };
        });

        if (!selections.length) {
            selections = null;
        }

        try {
            env.callRemote('openFile', filePath, selections);
            envOpenFileStatus.innerText = 'opened';
        } catch (e) {
            envOpenFileStatus.innerText = 'not allowed';
        }
    }
});

envGetContentButton.addEventListener('click', async () => {
    try {
        envGetContentResponse.innerText = await env.callRemote('getContent');
    } catch (error) {
        envGetContentResponse.innerText = 'not allowed';
    }
});

function handleSelections(selections) {
    envSelections.innerHTML = '';

    if (selections) {
        selections.forEach(function (selection) {
            const selectionElement = document.createElement('div');
            const start = selection.start.line + ':' + selection.start.column;
            const end = selection.end.line + ':' + selection.end.column;

            selectionElement.textContent = start;

            if (start != end) {
                selectionElement.textContent += ' - ' + end;
            }

            envSelections.appendChild(selectionElement);
        });
    }
}
