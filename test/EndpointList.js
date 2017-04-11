var assert = require('assert');
var EndpointList = require('../src/classes/EndpointList');

describe('EndpointList', function() {
    it('should not update when content is the same', function() {
        var list = new EndpointList();
        var updates = 0;;

        list.on(function() {
            updates++;
        });

        list.set(['foo']);
        assert.equal(updates, 1);

        list.set(['foo']);
        assert.equal(updates, 1);

        list.set(['foo', 'foo']);
        assert.equal(updates, 1);

        list.set(['foo', 'bar']);
        assert.equal(updates, 2);

        list.set(['bar', 'foo']);
        assert.equal(updates, 2);

        list.set(['bar', 'foo', 'bar', 'foo']);
        assert.equal(updates, 2);
    });
});
