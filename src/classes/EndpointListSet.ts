import { EndpointList } from './EndpointList.js';

export class EndpointListSet extends EndpointList {
    endpointLists = new Set<EndpointList>();

    constructor() {
        super([]);
    }

    set() {
        super.set(
            ([] as string[]).concat(
                ...[...this.endpointLists].map((endpointList) => endpointList.value)
            )
        );
    }

    add(endpointList: EndpointList) {
        if (!this.endpointLists.has(endpointList)) {
            this.endpointLists.add(endpointList);
            endpointList.on(this.set, this);
            this.set();
        }
    }

    remove(endpointList: EndpointList) {
        if (this.endpointLists.has(endpointList)) {
            this.endpointLists.delete(endpointList);
            endpointList.off(this.set, this);
            this.set();
        }
    }
}
