/* eslint-env browser */
/* global rempl */

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
var env = rempl.getEnv('editor');
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
    envName.innerHTML = data.name + ' ' + data.version;
    envElement.hidden = false;
    noEnv.hidden = true;
});
env.ns('activeTab').subscribe(function(data) {
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

envOpenFileButton.addEventListener('click', function() {
    var parts = envOpenFileInput.value.split(',');
    var filePath = parts.splice(0, 1)[0];

    if (filePath) {
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

        if (!selections.length) {
            selections = null;
        }

        env.callRemote('openFile', filePath, selections, function(error) {
            envOpenFileStatus.innerText = !error ? 'opened' : 'not allowed';
        });
    }
});

envGetContentButton.addEventListener('click', function() {
    env.callRemote('getContent', function(error, content) {
        envGetContentResponse.innerText = !error ? content : 'not allowed';
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
