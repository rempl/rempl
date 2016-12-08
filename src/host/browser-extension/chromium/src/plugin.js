/* eslint-env browser */
/* global chrome, slice, genUID, createIndicator, RemplCustomer */

var DEBUG = false;
var inspectedWindow = chrome.devtools.inspectedWindow;
var debugIndicator = DEBUG ? createIndicator() : null;
var pageConnected = false;
var remplConnected = false;
var devtoolSession = null;
var devtoolFeatures = [];
var selectedProvider = null;
var providers = [];
var callbacks = {};
var listeners;
var subscribers = createSubscribers();
var dropSandboxTimer;
var sandbox;
var page = chrome.extension.connect({
    name: 'rempl:host'
});

function $(id) {
    return document.getElementById(id);
}

function updateConnectionStateIndicator(id, state) {
    $(id).innerHTML = state ? 'OK' : 'pending...';
    $(id).className = 'state ' + (state ? 'ok' : 'pending');
}

function updateIndicator() {
    if (!selectedProvider) {
        selectedProvider = providers[0] || null;
        if (selectedProvider) {
            requestUI();
        }
    }

    updateConnectionStateIndicator('connection-to-page', pageConnected);
    updateConnectionStateIndicator('connection-to-rempl', remplConnected);
    updateConnectionStateIndicator('connection-to-provider', selectedProvider !== null);

    $('state-banner').style.display = pageConnected && remplConnected && selectedProvider ? 'none' : 'block';

    if (DEBUG) {
        debugIndicator.style.background = [
            'gray',   // once disconnected
            'orange', // pageConnected but without a page
            'green'   // all connected
        ][pageConnected + remplConnected];
    }
}

function sandboxError(message) {
    sandbox.srcdoc = '<div style="padding:20px;color:#D00;">' + message + '</div>';
}

function initSandbox() {
    clearTimeout(dropSandboxTimer);
    dropSandbox();
    sandbox = document.createElement('iframe');
    sandbox.srcdoc = '<div id="sandbox-splashscreen" style="padding:20px;color:#888;">Fetching UI...</div>';
    document.documentElement.appendChild(sandbox);
}

function notify(type, args) {
    for (var i = 0; i < subscribers[type].length; i++) {
        subscribers[type][i].apply(null, args);
    }
}

function createSubscribers() {
    return {
        data: [],
        session: [],
        connection: [],
        features: []
    };
}

function scriptWrapper(fn) {
    var host = parent;
    var getRemoteAPI = window.name || location.hash.substr(1);
    var remoteAPI = typeof host[getRemoteAPI] === 'function' ? host[getRemoteAPI]() : null;

    fn.call(this, remoteAPI);
}

function requestUI() {
    // send interface UI request
    // TODO: reduce reloads
    initSandbox();
    sendToPage('getRemoteUI', function(err, type, content) {
        if (err) {
            return sandboxError('Fetch UI error: ' + err);
        }

        if (type !== 'script') {
            return sandboxError('Unsupported UI content: ' + type);
        }

        initUI(content);
    });
}

function initUI(script) {
    var apiId = genUID();
    var customer = new RemplCustomer('foo');

    subscribers = createSubscribers();
    subscribers.data.push(customer.processInput);
    customer.channels.plugin = function() {
        sendToPage.apply(null, ['data'].concat(slice(arguments)));
    };

    window[apiId] = function createAPI() {
        return customer;
        console.log(devtoolSession, devtoolFeatures); // FIXME: added to avoid no-unused-vars warnings
        // return {
        //     send: function() {
        //         sendToPage.apply(null, ['data'].concat(slice(arguments)));
        //     },
        //     subscribe: function(channel, fn) {
        //         if (typeof channel === 'function') {
        //             fn = channel;
        //             channel = 'data';
        //         }

        //         if (!subscribers.hasOwnProperty(channel)) {
        //             return console.warn('[remote inspector] Unknown channel name: ' + channel);
        //         }

        //         subscribers[channel].push(fn);

        //         switch (channel) {
        //             case 'session':
        //                 fn(devtoolSession);
        //                 break;
        //             case 'connection':
        //                 fn(remplConnected);
        //                 break;
        //             case 'features':
        //                 fn(devtoolFeatures);
        //                 break;
        //         }

        //         return this;
        //     }
        // };
    };

    setTimeout(function() {
        sandbox.contentWindow.location.hash = apiId;
        sandbox.contentWindow.eval(
            'document.getElementById("sandbox-splashscreen").style.display="none";' +
            '(' + scriptWrapper + ').call(this,function(rempl){' +
                script +
            '});'
        );
    }, 10);
}

function dropSandbox() {
    if (sandbox) {
        subscribers = createSubscribers();
        sandbox.parentNode.removeChild(sandbox);
        sandbox.setAttribute('srcdoc', '');
        sandbox.setAttribute('src', '');
        sandbox = null;
    }
}

function sendToPage(type) {
    var args = slice(arguments, 1);
    var callback = false;

    if (args.length && typeof args[args.length - 1] === 'function') {
        callback = genUID();
        callbacks[callback] = args.pop();
    }

    if (DEBUG) {
        console.log('[rempl][devtools plugin] send data', callback, args);
    }

    page.postMessage({
        type: type,
        endpoint: selectedProvider,
        data: args,
        callback: callback
    });
}

page.onMessage.addListener(function(packet) {
    if (DEBUG) {
        console.log('[rempl][devtools plugin] Recieve:', packet);
    }

    var args = packet.data;
    var callback = packet.callback;

    if (packet.type === 'callback') {
        if (callbacks.hasOwnProperty(callback)) {
            callbacks[callback].apply(null, args);
            delete callbacks[callback];
        }
        return;
    }

    if (callback) {
        args = args.concat(function() {
            if (DEBUG) {
                console.log('[rempl][devtools plugin] send callback', callback, args);
            }

            page.postMessage({
                type: 'callback',
                callback: callback,
                data: slice(arguments)
            });
        });
    }

    if (listeners.hasOwnProperty(packet.type)) {
        listeners[packet.type].apply(null, args);
    }
});

listeners = {
    'connect': function() {
        pageConnected = true;
        updateIndicator();
    },
    'page:connect': function(sessionId, features, providers_) {
        notify('session', [devtoolSession = sessionId]);
        notify('features', [devtoolFeatures = features]);
        notify('connection', [remplConnected = true]);
        providers = providers_;
        updateIndicator();
    },
    'disconnect': function() {
        pageConnected = false;
        notify('features', [devtoolFeatures = []]);
        notify('connection', [remplConnected = false]);
        providers = [];
        selectedProvider = null;
        updateIndicator();
        dropSandboxTimer = setTimeout(dropSandbox, 3000);
    },
    'features': function(features) {
        notify('features', [devtoolFeatures = features]);
    },
    'providers': function(providers_) {
        providers = providers_;

        if (selectedProvider && providers.indexOf(selectedProvider) === -1) {
            selectedProvider = null;
            dropSandbox();
        }

        updateIndicator();
    },
    'data': function() {
        if (DEBUG) {
            console.log('[rempl][devtools plugin] recieve data', arguments);
        }

        notify('data', arguments);
    }
};

page.postMessage({
    type: 'plugin:init',
    tabId: inspectedWindow.tabId
});
