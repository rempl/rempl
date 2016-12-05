/* eslint-env browser */
/* global chrome, genUID, createIndicator */

var DEBUG = false;
var sessionId = genUID();
var pluginConnected = false;
var remplConnected = false;
var features = [];
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
                sendToPlugin('provider:connect', [sessionId, features]);
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
        sendToPlugin('provider:connect', [sessionId, packet.features || features]);
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

    if (packet.type === 'features') {
        features = packet.data[0];
        if (!pluginConnected) {
            return;
        }
    }

    plugin.postMessage(packet);
});

handshake();
