import { ReactiveValue } from './ReactiveValue.js';

function normalize(oldList: string[], newList?: string[]) {
    const uniqueItems = [...new Set(Array.isArray(newList) ? newList : [])];
    const diff =
        uniqueItems.length !== oldList.length ||
        uniqueItems.some((endpoint) => !oldList.includes(endpoint));

    return diff ? uniqueItems : oldList;
}

export class EndpointList extends ReactiveValue<string[]> {
    constructor(list?: string[]) {
        super(normalize([], list));
    }

    set(newValue: string[]): void {
        super.set(normalize(this.value, newValue));
    }
}
