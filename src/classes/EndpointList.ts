import Token from "./Token";

function normalize(oldList: string[], newList?: string[]) {
    if (!Array.isArray(newList)) {
        newList = [];
    }

    newList = newList.filter((endpoint, idx, array) => {
        // unique values
        return idx === 0 || array.lastIndexOf(endpoint, idx - 1) === -1;
    });
    const diff =
        newList.length !== oldList.length ||
        newList.some(function (endpoint) {
            return oldList.indexOf(endpoint) === -1;
        });

    return diff ? newList : oldList;
}

export default class EndpointList extends Token<string[]> {
    constructor(list?: string[]) {
        super(normalize([], list));
    }

    set(newValue: string[]): void {
        super.set(normalize(this.value, newValue));
    }
}
