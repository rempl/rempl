/* global chrome */

var DEBUG = false;
var connections = {};

function getConnection(id) {
    if (id in connections === false) {
        connections[id] = {
            page: null,
            plugin: null
        };
    }

    return connections[id];
}

function sendToPage(connection, payload) {
    if (connection && connection.page) {
        if (DEBUG) {
            console.log('-> page', payload);
        }

        connection.page.postMessage(payload);
    } else {
        if (DEBUG) {
            console.warn('-> page [not sent - no connection]', payload);
        }
    }
}

function sendToPlugin(connection, payload) {
    if (connection && connection.plugin) {
        if (DEBUG) {
            console.log('-> plugin', payload);
        }

        connection.plugin.postMessage(payload);
    } else {
        if (DEBUG) {
            console.warn('-> plugin [not sent - no connection]', payload);
        }
    }
}

function connectPage(page) {
    var tabId = page.sender.tab && page.sender.tab.id;
    var connection = getConnection(tabId);

    connection.page = page;

    if (connection.plugin) {
        sendToPlugin(connection, { type: 'connect' });
        sendToPage(connection, { type: 'connect' });
    }

    page.onMessage.addListener(function(payload) {
        if (DEBUG) {
            console.log('page -> plugin', payload);
        }

        // proxy: page -> plugin
        sendToPlugin(connection, payload);
    });

    page.onDisconnect.addListener(function() {
        if (DEBUG) {
            console.log('page disconnect', tabId);
        }

        connection.page = null;
        sendToPlugin(connection, { type: 'disconnect' });
    });
}

function connectPlugin(plugin) {
    var connection;

    plugin.onMessage.addListener(function(payload) {
        if (DEBUG) {
            console.log('plugin -> page', payload);
        }

        if (payload.type == 'plugin:init') {
            connection = getConnection(payload.tabId);
            connection.plugin = plugin;
            // connection.tabId = plugin.sender.tab && plugin.sender.tab.id;

            if (connection.page) {
                sendToPlugin(connection, { type: 'connect' });
                sendToPage(connection, { type: 'connect' });
            }

            return;
        }

        // proxy: plugin -> page
        sendToPage(connection, payload);
    });

    plugin.onDisconnect.addListener(function() {
        if (connection) {
            if (DEBUG) {
                console.log('plugin disconnect');
            }

            connection.plugin = null;
            sendToPage(connection, { type: 'disconnect' });
        }
    });
}

chrome.extension.onConnect.addListener(function(port) {
    if (port.name == 'rempl:page') {
        connectPage(port);
    }

    if (port.name == 'rempl:host') {
        connectPlugin(port);
    }
});
