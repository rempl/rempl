var assert = require('assert');
var assertConsole = require('./helpers/console');
var Endpoint = require('../src/classes/Endpoint');

describe('Endpoint', function() {
    describe('getRemoteMethod()', function() {
        it('should return a function', function() {
            var endpoint = new Endpoint();
            var method = endpoint.getRemoteMethod('foo');

            assert.equal(typeof method, 'function');
        });

        it('should invoke callRemote when remote method is available', function() {
            var endpoint = new Endpoint();
            var method = endpoint.getRemoteMethod('foo');
            var cb = function() {};
            var callRemoteArgs = null;

            endpoint.setRemoteApi({ '*': ['foo'] });
            endpoint.namespaces['*'].callRemote = function() {
                callRemoteArgs = Array.prototype.slice.call(arguments);
            };
            method(1, 2, cb);

            assert.deepEqual(callRemoteArgs, ['foo', 1, 2, cb]);
        });

        it('should warn when invoke callRemote and remote method is not available', function() {
            var endpoint = new Endpoint('test');
            var method = endpoint.getRemoteMethod('foo');
            var callRemoteArgs = null;

            endpoint.callRemote = function() {
                callRemoteArgs = Array.prototype.slice.call(arguments);
            };

            assertConsole(function() {
                method(1, 2);
            }, [
                { type: 'warn', args: ['[rempl] Endpoint#test ns(*) has no available remote method `foo`'] }
            ]);
            assert.equal(callRemoteArgs, null);
        });

        it('should update available property on remote API changes', function() {
            var endpoint = new Endpoint();
            var method = endpoint.getRemoteMethod('foo');

            assert.equal(method.available, false);

            endpoint.setRemoteApi({});
            assert.equal(method.available, false);

            endpoint.setRemoteApi({ '*': ['foo'] });
            assert.equal(method.available, true);

            endpoint.setRemoteApi({ '*': ['bar'] });
            assert.equal(method.available, false);

            endpoint.setRemoteApi({ '*': ['bar', 'foo'] });
            assert.equal(method.available, true);

            endpoint.setRemoteApi({});
            assert.equal(method.available, false);

            endpoint.setRemoteApi({ x: ['foo'] });
            assert.equal(method.available, false);
        });
    });
});
