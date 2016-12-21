/* eslint-env browser */
/* global io, basis, resource, asset */

var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var transport = require('../transport.js');
var sandboxApi = {};
var initSandbox = require('rempl:sandbox/index.js');
var SANDBOX_HTML = asset('./template/sandbox-blank.html');
var REMPL_SCRIPT = basis.path.resolve(asset('rempldist:rempl.js'));

function createSandboxAPI(client, win) {
    function notify(type, args) {
        for (var i = 0; i < subscribers[type].length; i++) {
            subscribers[type][i].apply(null, args);
        }
    }

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
            socket.emit('rempl:join session', client.data.clientId, client.data.name, function(err) {
                if (err) {
                    retryTimer = setTimeout(joinSession, 2000);
                }
            });
        })
        .on('rempl:session data', function() {
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

    initSandbox(win, client.data.name, function(api) {
        api.subscribe(function() {
            socket.emit.apply(socket, ['rempl:to session'].concat(Array.prototype.slice.call(arguments)));
        });
        subscribers.data.push(api.send);
    });
};

var Frame = Node.subclass({
    type: null,
    script: null,

    template: resource('./template/sandbox-frame.tmpl'),
    binding: {
        api: 'apiId',
        src: function(node) {
            return node.url || SANDBOX_HTML;
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
            // run publisher UI code in sandbox and get created socket for future teardown
            var contentWindow = this.element.contentWindow;

            // run UI script
            contentWindow.eval(
                '(function(){var s=document.createElement("script");s.src="' + REMPL_SCRIPT + '";document.documentElement.appendChild(s)})();' +
                this.script +
                'console.log("Remote publisher UI (' + (this.url || 'script') + ') inited");' +
                '//# sourceURL=publisher-ui-launcher.js'
            );

            createSandboxAPI.call(this, this.client, contentWindow);
        }
    },

    init: function() {
        Node.prototype.init.call(this);
        this.apiId = basis.genUID();
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
