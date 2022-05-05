var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var EndpointList = require('./EndpointList');
var Endpoint = require('./Endpoint');

function genUID(len) {
    function base36(val) {
        return Math.round(val).toString(36);
    }

    // uid should starts with alpha
    let result = base36(10 + 25 * Math.random());

    if (!len) {
        len = 16;
    }

    while (result.length < len) {
        result += base36(Date.now() * Math.random());
    }

    return result.substr(0, len);
}

function packet(type, args) {
    return [type].concat(Array.prototype.slice.call(args));
}

module.exports = function (wsServer, httpServer, options) {
    var endpoints = new EndpointList(wsServer);
    var onEndpointConnectMode = null;
    var lastNum = 0;
    var exclusiveEndpointId = options.remplExclusivePublisher ? genUID() : null;

    wsServer.addClientApi(path.join(__dirname, 'ws-client-api.js'), function (content) {
        if (options.remplEndpoint) {
            return (
                'var socket = io.connect("' +
                options.remplEndpoint +
                '", { transports: ["websocket", "polling"] })' +
                content
            );
        } else {
            return content;
        }
    });

    wsServer.on('connect', function (socket) {
        //
        // endpoint (publishers) -> ws server
        //
        socket.on('rempl:endpoint connect', function (data, connectCallback) {
            data = data || {};

            var id = exclusiveEndpointId || data.id || genUID();
            var endpoint = endpoints.get('id', id);

            if (!endpoint) {
                endpoint = new Endpoint(endpoints, id, this, data);
                endpoint.num = lastNum++;
            } else {
                endpoint.update(data);
                endpoint.setOnline(this);
            }

            this.on('rempl:endpoint info', function (data) {
                endpoint.update(data);
                endpoints.notifyUpdates();
            })
                .on('rempl:from publisher', function (publisherId) {
                    // var channel = socket.to(endpoint.room);
                    // channel.emit.apply(channel, packet('rempl:to subscriber', arguments));
                    var args = Array.prototype.slice.call(arguments, 1);
                    endpoint.subscribers.forEach(function (subscriber) {
                        if (subscriber.publisherId === publisherId) {
                            subscriber.emit.apply(subscriber, packet('rempl:to subscriber', args));
                        }
                    });
                })
                .on('disconnect', function () {
                    endpoint.setOffline();
                });

            // connected and inited
            connectCallback({
                id: id,
                subscribers: endpoint.subscribers.length,
                num: endpoint.num,
            });

            if (typeof onEndpointConnectMode == 'function') {
                onEndpointConnectMode(endpoint);
            }
        });

        //
        // host -> ws server
        //
        socket.on('rempl:host connect', function (connectCallback) {
            this.on('rempl:pick publisher', function (pickCallback) {
                function startIdentify(endpoint) {
                    endpoint.emitIfPossible('rempl:identify', endpoint.num, function (publisherId) {
                        pickCallback(endpoint.id, publisherId);
                        stopIdentify();
                    });
                }
                function stopIdentify() {
                    onEndpointConnectMode = null;
                    socket.removeListener('disconnect', stopIdentify);
                    socket.removeListener('rempl:cancel publisher pick', stopIdentify);
                    endpoints.forEach(function (endpoint) {
                        endpoint.emitIfPossible('rempl:stop identify');
                    });
                }

                onEndpointConnectMode = startIdentify;
                lastNum = 1;

                this.once('disconnect', stopIdentify);
                this.once('rempl:cancel publisher pick', stopIdentify);
                endpoints.forEach(function (endpoint) {
                    endpoint.num = lastNum++;
                    startIdentify(endpoint);
                });
                endpoints.notifyUpdates();
            });

            this.on('rempl:get publisher ui', function (id, publisherId, callback) {
                var endpoint = endpoints.get('id', id);

                if (!endpoint || !endpoint.socket) {
                    return callback(
                        '[rempl:get publisher ui] Endpoint (' + id + ') not found or disconnected'
                    );
                }

                endpoint.emit(
                    'rempl:get ui',
                    publisherId,
                    {
                        dev: options.dev,
                        accept: ['script', 'url'],
                    },
                    callback
                );
            });

            connectCallback({
                endpoints: endpoints.getList(),
                exclusivePublisher: exclusiveEndpointId
                    ? exclusiveEndpointId + '/' + options.remplExclusivePublisher
                    : null,
            });
        });

        //
        // subscriber -> ws server (endpoint/publisher)
        //
        socket.on('rempl:connect to publisher', function (id, publisherId, callback) {
            var endpoint = endpoints.get('id', id);

            if (!endpoint || !endpoint.socket) {
                return callback(
                    '[rempl:connect to publisher] Endpoint (' + id + ') not found or disconnected'
                );
            }

            endpoint.addSubscriber(this);
            this.publisherId = publisherId;
            this.join(endpoint.room)
                .on('rempl:to publisher', function () {
                    endpoint.emit.apply(
                        endpoint,
                        packet('rempl:to publisher', packet(publisherId, arguments))
                    );
                })
                .on(
                    'disconnect',
                    function () {
                        endpoint.removeSubscriber(this);
                    }.bind(this)
                );

            callback();
        });
    });

    if (options.remplStandalone) {
        console.log('Init ' + chalk.green('standalone version') + ' of ' + chalk.yellow('rempl'));
    } else if (
        options.dev ||
        !fs.existsSync(path.join(__dirname, '../dist/server-client/index.html'))
    ) {
        console.warn('Init ' + chalk.yellow('dev version') + ' of ' + chalk.yellow('rempl'));
        httpServer.addSymlink('/basisjs-tools/basis', path.dirname(require.resolve('basisjs')));
        httpServer.addSymlink('/basisjs-tools/rempl', path.resolve(__dirname, '..'));
        httpServer.addSymlink('/basisjs-tools/devtool', path.join(__dirname, 'client'));
    } else {
        if (options.verbose) {
            console.log('Init ' + chalk.green('build version') + ' of ' + chalk.yellow('rempl'));
        }

        httpServer.addSymlink(
            '/basisjs-tools/rempl',
            path.join(__dirname, '../dist/server-client')
        );
    }
};
