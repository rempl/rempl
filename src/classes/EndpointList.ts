import { Token } from './Token.js';
import { Endpoint } from './Endpoint.js';

function normalize<T>(oldList: T[], newList: T[]) {
    newList = Array.isArray(newList)
        ? [...new Set(newList)]
        : [];

    const diff = newList.length !== oldList.length ||
        newList.some(endpoint => !oldList.includes(endpoint));

    return diff ? newList : oldList;
}

export class EndpointList<T extends Endpoint> extends Token<T[]> {
    constructor(list?: T[]) {
        super(normalize([], list));
    }
    set(newValue: T[] = []) {
        return super.set(normalize(this.value, newValue));
    }
}
