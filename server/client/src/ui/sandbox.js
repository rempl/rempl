/* eslint-env browser */
/* global io, basis, resource, asset */

var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var transport = require('../transport.js');
var env = require('../env.js');
var initSandbox = require('rempl:sandbox/index.js');
var createHost = require('rempl:env/createHost.js');
var SANDBOX_HTML = asset('./template/sandbox-blank.html');
var remplScript = (function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', basis.path.resolve(asset('rempldist:rempl.js')), false);
    xhr.setRequestHeader('If-Modified-Since', new Date(0).toGMTString());
    xhr.send('');

    return xhr.status >= 200 && xhr.status < 400
        ? xhr.responseText
        : '';
})();

function createSandboxApi(endpoint, win) {
    function notify(type, args) {
        for (var i = 0; i < subscribers[type].length; i++) {
            subscribers[type][i].apply(null, args);
        }
    }

    var sessionId = Value.query(endpoint, 'data.sessionId');
    var online = Value.query(endpoint, 'data.online');
    var envUnsubscribe;
    var retryTimer;
    var subscribers = {
        data: [],
        session: [],
        connection: []
    };

    var socket = io('', { transports: ['websocket', 'polling'] })
        .on('connect', function joinSession() {
            socket.emit('rempl:connect to publisher', endpoint.data.endpointId, endpoint.data.name, function(err) {
                if (err) {
                    retryTimer = setTimeout(joinSession, 2000);
                }
            });
        })
        .on('rempl:to subscriber', function() {
            notify('data', arguments);
        });

    sessionId.link(subscribers, function(sessionId) {
        notify('session', [sessionId]);
    });
    online.link(subscribers, function(online) {
        notify('connection', [online]);
    });

    initSandbox(win, endpoint.data.name, function(api) {
        api.subscribe(function() {
            socket.emit.apply(socket, ['rempl:to publisher'].concat(basis.array(arguments)));
        });
        subscribers.data.push(api.send);
    });

    // link with host
    var host = createHost(win);
    host.subscribe(env.send);

    envUnsubscribe = env.subscribe(host.send);
    env.send({
        type: 'getHostInfo'
    });

    // return destroy function
    return function destroySandboxApi() {
        envUnsubscribe();
        clearTimeout(retryTimer);
        sessionId.unlink(subscribers);
        online.unlink(subscribers);
        socket.close();
        socket = null;
    };
}

var Frame = Node.subclass({
    type: null,
    script: null,
    destroySandboxApi: null,

    template: resource('./template/sandbox-frame.tmpl'),
    binding: {
        api: function() {
            return basis.genUID();
        },
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
            var contentWindow = this.element.contentWindow;

            // run publisher UI script
            if (this.script) {
                contentWindow.eval(
                    remplScript +
                    '\n//# sourceURL=rempl.js'
                );
                contentWindow.eval(
                    this.script +
                    '\n//# sourceURL=publisher-ui.js'
                );
            }

            this.teardownApi();
            this.destroySandboxApi = createSandboxApi(this.endpoint, contentWindow);
        }
    },
    teardownApi: function() {
        if (typeof this.destroySandboxApi === 'function') {
            this.destroySandboxApi();
            this.destroySandboxApi = null;
        }
    },

    destroy: function() {
        this.teardownApi();

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
        hasPublisher: Value.query('data.id').as(Boolean),
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
            } else if ('online' in delta && this.data.online && this.error.value) {
                this.syncUI();
            }
        }
    },

    syncUI: function() {
        if (this.satellite.frame) {
            this.satellite.frame.destroy();
        }

        if (this.data.id) {
            this.loading.set(true);
            this.error.set();
            transport.getPublisherUI(this.data.id, function(err, type, content) {
                this.loading.set(false);

                if (err) {
                    this.error.set(err);
                } else if (this.data.uiContent != null) {
                    this.setSatellite('frame', new Frame({
                        endpoint: this,
                        url: type === 'url' ? content : null,
                        script: type === 'script' ? content : ''
                    }));
                }
            }.bind(this));
        }
    }
});
