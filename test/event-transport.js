var assert = require('assert');
var EventTransport = require('./helpers/event-transport.js').EventTransport;
var createScope = require('./helpers/event-transport.js').createScope;

describe('EventTransport', function() {
    var scope;

    beforeEach(function() {
        scope = createScope();
    });
    afterEach(function() {
        scope.destroy();
        scope = null;
    });

    it('create a transport with no pair', function(done) {
        new EventTransport('foo', 'bar');

        scope.await(function(messages) {
            assert.deepEqual(messages, [
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: null, endpoints: [] } }
            ]);
            done();
        });
    });

    it('create transport pair in one frame', function(done) {
        new EventTransport('foo', 'bar');
        new EventTransport('bar', 'foo');

        scope.await(function(messages) {
            assert.deepEqual(messages, [
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: null, endpoints: [] } },
                { channel: 'bar:connect', payload: { connectTo: 'foo', input: 'bar:...', output: null, endpoints: [] } },
                { channel: 'bar:connect', payload: { connectTo: 'foo', input: 'bar:...', output: 'foo:...', endpoints: [] } },
                { channel: 'foo:...',     payload: { type: 'connect',  data: [[]] } },
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: 'bar:...', endpoints: [] } },
                { channel: 'bar:...',     payload: { type: 'connect',  data: [[]] } },
                { channel: 'bar:...',     payload: { type: 'connect',  data: [[]] } },
                { channel: 'foo:...',     payload: { type: 'connect',  data: [[]] } }
            ]);
            done();
        });
    });

    it('create transport pair in different frames', function(done) {
        new EventTransport('foo', 'bar');

        scope.await(function(messages) {
            assert.deepEqual(messages, [
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: null, endpoints: [] } }
            ]);

            new EventTransport('bar', 'foo');

            scope.await(function(messages) {
                assert.deepEqual(messages, [
                    { channel: 'bar:connect', payload: { connectTo: 'foo', input: 'bar:...', output: null, endpoints: [] } },
                    { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: 'bar:...', endpoints: [] } },
                    { channel: 'bar:...', payload: { type: 'connect', data: [[]] } },
                    { channel: 'foo:...', payload: { type: 'connect', data: [[]] } }
                ]);
                done();
            });
        });
    });

    it('transports created in one frame should not connect when no full match (foo->bar && bar->baz)', function(done) {
        new EventTransport('foo', 'bar');
        new EventTransport('bar', 'baz');

        scope.await(function(messages) {
            assert.deepEqual(messages, [
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: null, endpoints: [] } },
                { channel: 'bar:connect', payload: { connectTo: 'baz', input: 'bar:...', output: null, endpoints: [] } }
            ]);

            done();
        });
    });

    it('transports created in different frames should not connect when no full match (foo->bar && bar->baz)', function(done) {
        new EventTransport('foo', 'bar');

        scope.await(function(messages) {
            assert.deepEqual(messages, [
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: null, endpoints: [] } }
            ]);

            new EventTransport('bar', 'baz');
            scope.await(function(messages) {
                assert.deepEqual(messages, [
                    { channel: 'bar:connect', payload: { connectTo: 'baz', input: 'bar:...', output: null, endpoints: [] } }
                ]);
                done();
            });
        });
    });

    it('transports created in one frame should not connect when no full match (foo->bar && baz->foo)', function(done) {
        new EventTransport('foo', 'bar');
        new EventTransport('baz', 'foo');

        scope.await(function(messages) {
            assert.deepEqual(messages, [
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: null, endpoints: [] } },
                { channel: 'baz:connect', payload: { connectTo: 'foo', input: 'baz:...', output: null, endpoints: [] } }
            ]);

            done();
        });
    });

    it('transports created in different frames should not connect when no full match (foo->bar && baz->foo)', function(done) {
        new EventTransport('foo', 'bar');

        scope.await(function(messages) {
            assert.deepEqual(messages, [
                { channel: 'foo:connect', payload: { connectTo: 'bar', input: 'foo:...', output: null, endpoints: [] } }
            ]);

            new EventTransport('baz', 'foo');
            scope.await(function(messages) {
                assert.deepEqual(messages, [
                    { channel: 'baz:connect', payload: { connectTo: 'foo', input: 'baz:...', output: null, endpoints: [] } }
                ]);
                done();
            });
        });
    });
});
