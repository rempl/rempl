import EndpointList from './EndpointList';

export default class EndpointListSet extends EndpointList {
    endpointLists: EndpointList[] = [];

    constructor() {
        super([]);
    }

    set(): void {
        super.set(
            this.endpointLists.reduce((result, list) => result.concat(list.value), [] as string[])
        );
    }

    add(endpointList: EndpointList): void {
        if (this.endpointLists.includes(endpointList)) {
            this.endpointLists.push(endpointList);
            endpointList.on(this.set, this);
            this.set();
        }
    }

    remove(endpointList: EndpointList): void {
        const idx = this.endpointLists.indexOf(endpointList);
        if (idx !== -1) {
            this.endpointLists.splice(idx, 1);
            endpointList.off(this.set, this);
            this.set();
        }
    }
}
