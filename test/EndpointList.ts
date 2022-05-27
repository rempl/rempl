import { equal } from 'assert';
import { EndpointList } from '../src/classes/EndpointList.js';

describe('EndpointList', () => {
    it('should not update when content is the same', () => {
        const list = new EndpointList();
        let updates = 0;

        list.on(() => updates++);

        list.set(['foo']);
        equal(updates, 1);

        list.set(['foo']);
        equal(updates, 1);

        list.set(['foo', 'foo']);
        equal(updates, 1);

        list.set(['foo', 'bar']);
        equal(updates, 2);

        list.set(['bar', 'foo']);
        equal(updates, 2);

        list.set(['bar', 'foo', 'bar', 'foo']);
        equal(updates, 2);
    });
});
