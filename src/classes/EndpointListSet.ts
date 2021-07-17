import { EndpointList } from './EndpointList.js';
import { Endpoint } from './Endpoint.js';

export class EndpointListSet<T extends Endpoint> extends EndpointList<T> {
    endpointLists: EndpointList<T>[];

    constructor() {
        super([]);
        this.endpointLists = [];
    }

    set() {
        const newValue = this.endpointLists
            .reduce((result, list) => result.concat(list.value), []);
        return super.set(newValue);
    }

    add(endpointList: EndpointList<T>) {
        const idx = this.endpointLists.indexOf(endpointList);
        if (idx === -1) {
            this.endpointLists.push(endpointList);
            endpointList.on(this.set, this);
            this.set();
        }
    }

    remove(endpointList: EndpointList<T>) {
        const idx = this.endpointLists.indexOf(endpointList);
        if (idx !== -1) {
            this.endpointLists.splice(idx, 1);
            endpointList.off(this.set, this);
            this.set();
        }
    }
}

module.exports = EndpointListSet;
