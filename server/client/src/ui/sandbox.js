/* eslint-env browser */
/* global io, basis, resource, asset */

var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var Node = require('basis.ui').Node;
var transport = require('../transport.js');
var createRemplSandbox = require('rempl:sandbox/index.js');
var remplScript = asset('rempldist:rempl.js', true);

function createSandbox(endpoint, options) {
    function notify(type, args) {
        for (var i = 0; i < subscribers[type].length; i++) {
            subscribers[type][i].apply(null, args);
        }
    }

    var sessionId = Value.query(endpoint, 'data.sessionId');
    var online = Value.query(endpoint, 'data.online');
    var publisherExists = Value.query(endpoint, 'delegate.sources.publisher.delegate').as(Boolean);
    var sessionOpenned = new Value({ value: false });
    var publisherConnected = new Expression(publisherExists, sessionOpenned, function(publisherExists, sessionOpenned) {
        return publisherExists && sessionOpenned;
    });
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
                } else {
                    sessionOpenned.set(true);
                }
            });
        })
        .on('disconnect', function() {
            sessionOpenned.set(false);
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

    var sandbox = createRemplSandbox(options, function(api) {
        api.subscribe(function() {
            socket.emit.apply(socket, ['rempl:to publisher'].concat(basis.array(arguments)));
        });
        subscribers.data.push(api.send);
        publisherConnected.link(null, function(connected) {
            api.send({
                type: connected ? 'publisher:connect' : 'publisher:disconnect'
            });
        });
    });

    // return destroy function
    return function destroySandboxApi() {
        clearTimeout(retryTimer);
        sessionId.unlink(subscribers);
        online.unlink(subscribers);
        sandbox.destroy();
        sandbox = null;
        socket.close();
        socket = null;
    };
}

module.exports = new Node({
    destroySandbox: null,
    loading: new basis.Token(false),
    error: new basis.Token(false),

    template: resource('./template/sandbox.tmpl'),
    binding: {
        hasPublisher: Value.query('data.id').as(Boolean),
        nonExclusiveMode: transport.exclusivePublisher.as(basis.bool.invert),
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
        if (typeof this.destroySandbox === 'function') {
            this.destroySandbox();
            this.destroySandbox = null;
        }

        if (this.data.id) {
            this.loading.set(true);
            this.error.set();
            transport.getPublisherUI(this.data.id, function(err, type, content) {
                this.loading.set(false);

                if (err) {
                    this.error.set(err);
                } else if (this.data.uiContent != null) {
                    this.destroySandbox = createSandbox(this, {
                        type: type,
                        content: content,
                        publisher: this.data.name,
                        remplScript: remplScript,
                        container: this.tmpl.frameWrapper
                    });
                }
            }.bind(this));
        }
    }
});
