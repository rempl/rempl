import { deepEqual } from 'assert';
import Endpoint from '../src/classes/Endpoint.js';
import { createScope, EventTransport } from './helpers/event-transport.js';

describe('EventTransport', () => {
    let scope;

    beforeEach(() => {
        scope = createScope();
    });
    afterEach(() => {
        scope.destroy();
        scope = null;
    });

    it('create a transport with no pair', (done) => {
        new EventTransport('foo', 'bar');

        scope.await((messages) => {
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

    it('create transport pair in one frame', (done) => {
        new EventTransport('foo', 'bar');
        new EventTransport('bar', 'foo');

        scope.await((messages) => {
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

    it('create transport pair in different frames', (done) => {
        new EventTransport('foo', 'bar');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new EventTransport('bar', 'foo');

            scope.await((messages) => {
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

    it('transports created in one frame should not connect when no full match (foo->bar && bar->baz)', (done) => {
        new EventTransport('foo', 'bar');
        new EventTransport('bar', 'baz');

        scope.await((messages) => {
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

    it('transports created in different frames should not connect when no full match (foo->bar && bar->baz)', (done) => {
        new EventTransport('foo', 'bar');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new EventTransport('bar', 'baz');
            scope.await((messages) => {
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

    it('transports created in one frame should not connect when no full match (foo->bar && baz->foo)', (done) => {
        new EventTransport('foo', 'bar');
        new EventTransport('baz', 'foo');

        scope.await((messages) => {
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

    it('transports created in different frames should not connect when no full match (foo->bar && baz->foo)', (done) => {
        new EventTransport('foo', 'bar');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new EventTransport('baz', 'foo');
            scope.await((messages) => {
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

    it('connection with endpoints', (done) => {
        const foo = new Endpoint('foo');
        const bar1 = new Endpoint('bar1');
        const bar2 = new Endpoint('bar2');

        new EventTransport('foo', 'bar').sync(foo);
        new EventTransport('bar', 'foo').sync(bar1);
        new EventTransport('bar', 'foo').sync(bar2);

        scope.await((messages) => {
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

    it('should send response for callRemote only to initiator', (done) => {
        const foo = new Endpoint('foo');
        const bar1 = new Endpoint('foo');
        const bar2 = new Endpoint('foo');

        const bar1Ret = [];
        const bar2Ret = [];

        new EventTransport('foo', 'bar').sync(foo);
        new EventTransport('bar', 'foo').sync(bar1);
        new EventTransport('bar', 'foo').sync(bar2);

        foo.provide('test', function (data, callback) {
            callback(data);
        });

        scope.await(() => {
            bar1.callRemote('test', 'bar1-test', function (ret) {
                bar1Ret.push(ret);
            });
            bar2.callRemote('test', 'bar2-test', function (ret) {
                bar2Ret.push(ret);
            });

            scope.await((messages) => {
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
                deepEqual(bar1Ret, ['bar1-test']);
                deepEqual(bar2Ret, ['bar2-test']);
                done();
            });
        });
    });
});
