import { deepEqual } from 'assert';
import { Endpoint } from '../src/classes/Endpoint.js';
import { createScope } from './helpers/event-transport.js';

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
        new scope.EventTransport('foo', 'bar');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);
            done();
        });
    });

    it('create transport pair in one frame', (done) => {
        new scope.EventTransport('foo', 'bar');
        new scope.EventTransport('bar', 'foo');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: { type: 'handshake', initiator: 'bar', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: { type: 'handshake', initiator: 'bar', inited: true, endpoints: [] },
                },
                { from: 'bar:1', to: 'foo:1', payload: { type: 'connect', endpoints: [] } },
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: true, endpoints: [] },
                },
                { from: 'foo:1', to: 'bar:1', payload: { type: 'connect', endpoints: [] } },
            ]);
            done();
        });
    });

    it('create transport pair in different frames', (done) => {
        new scope.EventTransport('foo', 'bar');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new scope.EventTransport('bar', 'foo');

            scope.await((messages) => {
                deepEqual(messages, [
                    {
                        from: 'bar:1',
                        to: 'foo:connect',
                        payload: {
                            type: 'handshake',
                            initiator: 'bar',
                            inited: false,
                            endpoints: [],
                        },
                    },
                    {
                        from: 'foo:1',
                        to: 'bar:connect',
                        payload: {
                            type: 'handshake',
                            initiator: 'foo',
                            inited: true,
                            endpoints: [],
                        },
                    },
                    { from: 'foo:1', to: 'bar:1', payload: { type: 'connect', endpoints: [] } },
                    { from: 'bar:1', to: 'foo:1', payload: { type: 'connect', endpoints: [] } },
                ]);
                done();
            });
        });
    });

    it('transports created in one frame should not connect when no full match (foo->bar && bar->baz)', (done) => {
        new scope.EventTransport('foo', 'bar');
        new scope.EventTransport('bar', 'baz');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'baz:connect',
                    payload: { type: 'handshake', initiator: 'bar', inited: false, endpoints: [] },
                },
            ]);

            done();
        });
    });

    it('transports created in different frames should not connect when no full match (foo->bar && bar->baz)', (done) => {
        new scope.EventTransport('foo', 'bar');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new scope.EventTransport('bar', 'baz');
            scope.await((messages) => {
                deepEqual(messages, [
                    {
                        from: 'bar:1',
                        to: 'baz:connect',
                        payload: {
                            type: 'handshake',
                            initiator: 'bar',
                            inited: false,
                            endpoints: [],
                        },
                    },
                ]);
                done();
            });
        });
    });

    it('transports created in one frame should not connect when no full match (foo->bar && baz->foo)', (done) => {
        new scope.EventTransport('foo', 'bar');
        new scope.EventTransport('baz', 'foo');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'baz:1',
                    to: 'foo:connect',
                    payload: { type: 'handshake', initiator: 'baz', inited: false, endpoints: [] },
                },
            ]);

            done();
        });
    });

    it('transports created in different frames should not connect when no full match (foo->bar && baz->foo)', (done) => {
        new scope.EventTransport('foo', 'bar');

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
            ]);

            new scope.EventTransport('baz', 'foo');
            scope.await((messages) => {
                deepEqual(messages, [
                    {
                        from: 'baz:1',
                        to: 'foo:connect',
                        payload: {
                            type: 'handshake',
                            initiator: 'baz',
                            inited: false,
                            endpoints: [],
                        },
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

        new scope.EventTransport('foo', 'bar').sync(foo);
        new scope.EventTransport('bar', 'foo').sync(bar1);
        new scope.EventTransport('bar', 'foo').sync(bar2);

        scope.await((messages) => {
            deepEqual(messages, [
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: { type: 'handshake', initiator: 'foo', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: { type: 'handshake', initiator: 'bar', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:2',
                    to: 'foo:connect',
                    payload: { type: 'handshake', initiator: 'bar', inited: false, endpoints: [] },
                },
                {
                    from: 'bar:1',
                    to: 'foo:connect',
                    payload: {
                        type: 'handshake',
                        initiator: 'bar',
                        inited: true,
                        endpoints: ['bar1'],
                    },
                },
                { from: 'bar:1', to: 'foo:1', payload: { type: 'connect', endpoints: ['bar1'] } },
                {
                    from: 'bar:2',
                    to: 'foo:connect',
                    payload: {
                        type: 'handshake',
                        initiator: 'bar',
                        inited: true,
                        endpoints: ['bar2'],
                    },
                },
                { from: 'bar:2', to: 'foo:1', payload: { type: 'connect', endpoints: ['bar2'] } },
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: {
                        type: 'handshake',
                        initiator: 'foo',
                        inited: true,
                        endpoints: ['foo'],
                    },
                },
                { from: 'foo:1', to: 'bar:1', payload: { type: 'connect', endpoints: ['foo'] } },
                {
                    from: 'foo:1',
                    to: 'bar:connect',
                    payload: {
                        type: 'handshake',
                        initiator: 'foo',
                        inited: true,
                        endpoints: ['foo'],
                    },
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

        new scope.EventTransport('foo', 'bar').sync(foo);
        new scope.EventTransport('bar', 'foo').sync(bar1);
        new scope.EventTransport('bar', 'foo').sync(bar2);

        foo.ns('*').provide('test', (data) => {
            return data;
        });

        scope.await(() => {
            bar1.ns('*')
                .callRemote('test', 'bar1-test')
                .then((ret) => {
                    bar1Ret.push(ret);
                });
            bar2.ns('*')
                .callRemote('test', 'bar2-test')
                .then((ret) => {
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
