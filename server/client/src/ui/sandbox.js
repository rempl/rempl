/* eslint-env browser */
/* global io, basis, resource, asset */

var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var Subscriber = require('rempl:subscriber/index.js');
var transport = require('../transport.js');
var sandboxApi = {};

function scriptWrapper(fn) {
    var host = parent;
    var getRemoteAPI = window.name || location.hash.substr(1);
    var remoteAPI = typeof host[getRemoteAPI] === 'function' ? host[getRemoteAPI]() : null;

    fn.call(this, remoteAPI);
}

function createSandboxAPI(client) {
    function notify(type, args) {
        for (var i = 0; i < subscribers[type].length; i++) {
            subscribers[type][i].apply(null, args);
        }
    }

    var subscriber = new Subscriber(client.data.name);
    var apiId = this.apiId;
    var sessionId = Value.query(client, 'data.sessionId');
    var online = Value.query(client, 'data.online');
    var features = Value.query(client, 'data.features');
    var retryTimer;
    var subscribers = {
        data: [],
        session: [],
        connection: [],
        features: []
    };

    var socket = io('', { transports: ['websocket', 'polling'] })
        .on('connect', function joinSession() {
            socket.emit('devtool:join session', client.data.clientId, client.data.name, function(err) {
                if (err) {
                    retryTimer = setTimeout(joinSession, 2000);
                }
            });
        })
        .on('devtool:session data', function() {
            notify('data', arguments);
        });

    // destroy old API
    if (sandboxApi[apiId]) {
        sandboxApi[apiId]();
    }

    sandboxApi[apiId] = function destroyApi() {
        delete sandboxApi[apiId];
        clearTimeout(retryTimer);
        sessionId.unlink(subscribers);
        online.unlink(subscribers);
        features.unlink(subscribers);
        socket.close();
        socket = null;
    };

    sessionId.link(subscribers, function(sessionId) {
        notify('session', [sessionId]);
    });
    online.link(subscribers, function(online) {
        notify('connection', [online]);
    });
    features.link(subscribers, function(features) {
        notify('features', [features]);
    });

    subscribers.data.push(subscriber.processInput);
    subscriber.channels.sandbox = function() {
        socket.emit.apply(socket, ['devtool:to session'].concat(Array.prototype.slice.call(arguments)));
    };

    return subscriber;

    return {
        // send: function() {
        //     socket.emit.apply(socket, ['devtool:to session'].concat(basis.array(arguments)));
        // },
        invoke: function(method) {
            var args = Array.prototype.slice.call(arguments);
            var callback = function() {};
            var method = args.shift();

            if (args.length && typeof args[args.length - 1] === 'function') {
                callback = args.pop();
            }

            socket.emit('devtool:to session', {
                ns: '*',
                type: 'call',
                method: method,
                args: args
            }, callback);
        },
        subscribe: function(channel, fn) {
            if (typeof channel === 'function') {
                fn = channel;
                channel = 'data';
            }

            if (!subscribers.hasOwnProperty(channel)) {
                return console.warn('[remote inspector] Unknown channel name: ' + channel);
            }

            subscribers[channel].push(fn);

            switch (channel) {
                case 'session':
                    fn(client.data.sessionId);
                    break;
                case 'connection':
                    fn(client.data.online);
                    break;
                case 'features':
                    fn(client.data.features);
                    break;
            }

            return this;
        }
    };
};

var Frame = Node.subclass({
    type: null,
    script: null,

    template: resource('./template/sandbox-frame.tmpl'),
    binding: {
        api: 'apiId',
        src: function(node) {
            return node.url || asset('./template/sandbox-blank.html');
        }
    },
    action: {
        ready: function() {
            if (this.ready) {
                return;
            }

            this.ready = true;
            this.initUI();
        }
    },
    initUI: function() {
        if (this.ready && this.element) {
            // run remote devtool code in sandbox and get created socket for future teardown
            var contentWindow = this.element.contentWindow;

            // set api reference to window.name since location bugs for some browsers
            // (in Edge location stays the same and doesn't equal to src)
            // TODO: investigate and found workaround
            contentWindow.name = this.apiId;

            // run UI script
            contentWindow.eval(
                ';(' + scriptWrapper + ').call(this,function(rempl) {' +
                    this.script +
                '});console.log("Remote devtool client (' + (this.url || 'script') + ') inited");'
            );
        }
    },

    init: function() {
        Node.prototype.init.call(this);
        this.apiId = basis.fn.publicCallback(
            createSandboxAPI.bind(this, this.client),
            true
        );
    },
    destroy: function() {
        // teardown socket connection
        var destroyApi = this.apiId && sandboxApi[this.apiId];

        if (destroyApi) {
            destroyApi();
        }

        // teardown document
        this.element.setAttribute('srcdoc', '');
        this.element.setAttribute('src', '');

        Node.prototype.destroy.call(this);
    }
});

module.exports = new Node({
    loading: new basis.Token(false),
    error: new basis.Token(false),

    template: resource('./template/sandbox.tmpl'),
    binding: {
        hasClient: Value.query('data.id').as(Boolean),
        loading: 'loading',
        error: 'error',
        online: 'data:',
        title: 'data:',
        isBrowser: Value.query('data.type').as(function(type) {
            return type == 'browser';
        }),
        isNode: Value.query('data.type').as(function(type) {
            return type == 'node';
        }),
        location: 'data:',
        pid: 'data:',
        frame: 'satellite:'
    },
    action: {
        drop: function() {
            this.owner.dropSelection();
        }
    },

    handler: {
        update: function(sender, delta) {
            if ('id' in delta) {
                this.syncUI();
            }
        }
        // targetChanged: function() {
        //     this.syncUI();
        // }
    },

    syncUI: function() {
        if (this.satellite.frame) {
            this.satellite.frame.destroy();
        }

        if (this.data.id) {
            this.loading.set(true);
            this.error.set();
            transport.getClientUI(this.data.id, function(err, type, content) {
                this.loading.set(false);

                if (err) {
                    this.error.set(err);
                } else if (this.data.uiContent != null) {
                    this.setSatellite('frame', new Frame({
                        client: this,
                        url: type === 'url' ? content : null,
                        script: type === 'script' ? content : ''
                    }));
                }
            }.bind(this));
        }
    }
});
