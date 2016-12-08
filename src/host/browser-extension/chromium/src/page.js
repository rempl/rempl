/* eslint-env browser */
/* global chrome, genUID, createIndicator */

var DEBUG = false;
var sessionId = genUID();
var pluginConnected = false;
var remplConnected = false;
var features = [];
var providers = [];
var debugIndicator = DEBUG ? createIndicator() : null;
var outputChannelId;
var inputChannelId = 'rempl-browser-extension-customer:' + genUID();

function updateIndicator() {
    if (debugIndicator) {
        debugIndicator.style.background = [
            'blue',   // once disconnected
            'orange', // pluginConnected but no a page
            'green'   // all connected
        ][pluginConnected + remplConnected];
    }
}

function sendToPlugin(event, data) {
    plugin.postMessage({
        type: event,
        data: data
    });
}

function emitPageEvent(channelId, data) {
    if (DEBUG) {
        console.log('[rempl][content script] send to page', channelId, data);
    }

    document.dispatchEvent(new CustomEvent(channelId, {
        detail: data
    }));
}

function sendToPage(data) {
    emitPageEvent(outputChannelId, data);
}

function handshake() {
    emitPageEvent('rempl-browser-extension-customer:connect', {
        input: inputChannelId,
        output: outputChannelId
    });
}

//
// set up transport
//

var plugin = chrome.runtime.connect({
    name: 'rempl:page'
});

plugin.onMessage.addListener(function(packet) {
    if (DEBUG) {
        console.log('[rempl][content script] from plugin', packet.type, packet);
    }

    switch (packet.type) {
        case 'connect':
            if (!pluginConnected && remplConnected) {
                sendToPlugin('page:connect', [sessionId, features, providers]);
                sendToPage({
                    type: 'connect'
                });
            }

            pluginConnected = true;
            updateIndicator();

            break;

        case 'disconnect':
            if (pluginConnected && remplConnected) {
                sendToPage({
                    type: 'disconnect'
                });
            }

            pluginConnected = false;
            updateIndicator();
            break;

        case 'getRemoteUI':
        case 'callback':
        case 'data':
            sendToPage(packet);
            break;
    }
});

//
// connect to basis.js devpanel
//

document.addEventListener('rempl-provider:connect', function(e) {
    if (outputChannelId) {
        return;
    }

    var packet = e.detail;
    outputChannelId = packet.input;
    remplConnected = true;
    updateIndicator();

    if (!packet.output) {
        handshake();
    }

    if (pluginConnected) {
        sendToPlugin('page:connect', [sessionId, packet.features || features, packet.providers || providers]);
        sendToPage({
            type: 'connect'
        });
    }
});

document.addEventListener(inputChannelId, function(e) {
    var packet = e.detail;

    if (DEBUG) {
        console.log('[rempl][content script] page -> plugin', packet);
    }

    switch (packet.type) {
        case 'features':
            features = packet.data;

            if (!pluginConnected) {
                return;
            }

            break;

        case 'providers':
            providers = packet.data;

            if (!pluginConnected) {
                return;
            }

            break;
    }

    plugin.postMessage(packet);
});

handshake();
