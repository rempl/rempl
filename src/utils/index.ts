import global from './global.js';

export { global };
export type TODO = any;

export type Complete<TDest, TSource> = TDest & Omit<TSource, keyof TDest>;

export type Fn<TArgs extends unknown[], TReturn, TThis = unknown> = (
    this: TThis,
    ...args: TArgs
) => TReturn;

export type AnyFn = Fn<any[], any>;

export type TypeRecord = Record<string, unknown>;

export function complete<
    TDest extends TypeRecord,
    TSource extends TypeRecord,
    TComplete = Complete<TDest, TSource>
>(dest: TDest, source: TSource): TComplete {
    for (const key in source) {
        if (!(key in dest)) {
            // @ts-ignore
            dest[key] = source[key];
        }
    }

    return dest as TComplete;
}

export function genUID(len?: number): string {
    function base36(val: number) {
        return Math.round(val).toString(36);
    }

    // uid should starts with alpha
    let result = base36(10 + 25 * Math.random());

    if (!len) {
        len = 16;
    }

    while (result.length < len) {
        result += base36(Date.now() * Math.random());
    }

    return result.substr(0, len);
}

export type Unsubscribe = () => void;

export function subscribe<TItem>(list: TItem[], item: TItem): Unsubscribe {
    list.push(item);

    return () => {
        const idx = list.indexOf(item);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
    };
}

export function hasOwnProperty(obj: TypeRecord, prop: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
