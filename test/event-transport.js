import { deepEqual } from 'assert';
import Endpoint from '../src/classes/Endpoint.js';
import { createScope, EventTransport } from './helpers/event-transport';

describe('EventTransport', function () {
    var scope;

    beforeEach(function () {
        scope = createScope();
    });
    afterEach(function () {
        scope.destroy();
        scope = null;
    });

    it('create a transport with no pair', function (done) {
        new EventTransport('foo', 'bar');

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);
            done();
        });
    });

    it('create transport pair in one frame', function (done) {
        new EventTransport('foo', 'bar');
        new EventTransport('bar', 'foo');

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: { initiator: 'bar', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: { initiator: 'bar', inited: true, endpoints: [] },
                },
                { from: 'bar:1', to: 'foo:1', payload: { type: 'connect', endpoints: [] } },
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: true, endpoints: [] },
                },
                { from: 'foo:1', to: 'bar:1', payload: { type: 'connect', endpoints: [] } },
            ]);
            done();
        });
    });

    it('create transport pair in different frames', function (done) {
        new EventTransport('foo', 'bar');

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new EventTransport('bar', 'foo');

            scope.await(function (messages) {
                deepEqual(messages, [
                    {
                        from: 'bar:1',
                        to: 'foo:connect',
                        payload: { initiator: 'bar', inited: false, endpoints: [] },
                    },
                    {
                        from: 'foo:1',
                        to: 'bar:connect',
                        payload: { initiator: 'foo', inited: true, endpoints: [] },
                    },
                    { from: 'foo:1', to: 'bar:1', payload: { type: 'connect', endpoints: [] } },
                    { from: 'bar:1', to: 'foo:1', payload: { type: 'connect', endpoints: [] } },
                ]);
                done();
            });
        });
    });

    it('transports created in one frame should not connect when no full match (foo->bar && bar->baz)', function (done) {
        new EventTransport('foo', 'bar');
        new EventTransport('bar', 'baz');

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'baz:connect',
                    payload: { initiator: 'bar', inited: false, endpoints: [] },
                },
            ]);

            done();
        });
    });

    it('transports created in different frames should not connect when no full match (foo->bar && bar->baz)', function (done) {
        new EventTransport('foo', 'bar');

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new EventTransport('bar', 'baz');
            scope.await(function (messages) {
                deepEqual(messages, [
                    {
                        from: 'bar:1',
                        to: 'baz:connect',
                        payload: { initiator: 'bar', inited: false, endpoints: [] },
                    },
                ]);
                done();
            });
        });
    });

    it('transports created in one frame should not connect when no full match (foo->bar && baz->foo)', function (done) {
        new EventTransport('foo', 'bar');
        new EventTransport('baz', 'foo');

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'baz:1',
                    to: 'foo:connect',
                    payload: { initiator: 'baz', inited: false, endpoints: [] },
                },
            ]);

            done();
        });
    });

    it('transports created in different frames should not connect when no full match (foo->bar && baz->foo)', function (done) {
        new EventTransport('foo', 'bar');

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new EventTransport('baz', 'foo');
            scope.await(function (messages) {
                deepEqual(messages, [
                    {
                        from: 'baz:1',
                        to: 'foo:connect',
                        payload: { initiator: 'baz', inited: false, endpoints: [] },
                    },
                ]);
                done();
            });
        });
    });

    it('connection with endpoints', function (done) {
        var foo = new Endpoint('foo');
        var bar1 = new Endpoint('bar1');
        var bar2 = new Endpoint('bar2');

        bar1.ret = [];
        bar2.ret = [];

        new EventTransport('foo', 'bar').sync(foo);
        new EventTransport('bar', 'foo').sync(bar1);
        new EventTransport('bar', 'foo').sync(bar2);

        scope.await(function (messages) {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: { initiator: 'bar', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:2',
                    to: 'foo:connect',
                    payload: { initiator: 'bar', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: { initiator: 'bar', inited: true, endpoints: ['bar1'] },
                },
                { from: 'bar:1', to: 'foo:1', payload: { type: 'connect', endpoints: ['bar1'] } },
                {
                    from: 'bar:2',
                    to: 'foo:connect',
                    payload: { initiator: 'bar', inited: true, endpoints: ['bar2'] },
                },
                { from: 'bar:2', to: 'foo:1', payload: { type: 'connect', endpoints: ['bar2'] } },
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: true, endpoints: ['foo'] },
                },
                { from: 'foo:1', to: 'bar:1', payload: { type: 'connect', endpoints: ['foo'] } },
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: true, endpoints: ['foo'] },
                },
                { from: 'foo:1', to: 'bar:2', payload: { type: 'connect', endpoints: ['foo'] } },
            ]);
            done();
        });
    });

    it('should send response for callRemote only to initiator', function (done) {
        var foo = new Endpoint('foo');
        var bar1 = new Endpoint('foo');
        var bar2 = new Endpoint('foo');

        bar1.ret = [];
        bar2.ret = [];

        new EventTransport('foo', 'bar').sync(foo);
        new EventTransport('bar', 'foo').sync(bar1);
        new EventTransport('bar', 'foo').sync(bar2);

        foo.provide('test', function (data, callback) {
            callback(data);
        });

        scope.await(function () {
            bar1.callRemote('test', 'bar1-test', function (ret) {
                bar1.ret.push(ret);
            });
            bar2.callRemote('test', 'bar2-test', function (ret) {
                bar2.ret.push(ret);
            });

            scope.await(function (messages) {
                deepEqual(messages, [
                    {
                        from: 'bar:1',
                        to: 'foo:1',
                        payload: {
                            type: 'data',
                            endpoint: 'foo',
                            data: [{ type: 'call', ns: '*', method: 'test', args: ['bar1-test'] }],
                            callback: 1,
                        },
                    },
                    {
                        from: 'bar:2',
                        to: 'foo:1',
                        payload: {
                            type: 'data',
                            endpoint: 'foo',
                            data: [{ type: 'call', ns: '*', method: 'test', args: ['bar2-test'] }],
                            callback: 2,
                        },
                    },
                    {
                        from: 'foo:1',
                        to: 'bar:1',
                        payload: { type: 'callback', callback: 1, data: ['bar1-test'] },
                    },
                    {
                        from: 'foo:1',
                        to: 'bar:2',
                        payload: { type: 'callback', callback: 2, data: ['bar2-test'] },
                    },
                ]);
                deepEqual(bar1.ret, ['bar1-test']);
                deepEqual(bar2.ret, ['bar2-test']);
                done();
            });
        });
    });
});
