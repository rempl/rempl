export * from './global.js';

export type Fn<TArgs extends unknown[], TReturn, TThis = unknown> = (
    this: TThis,
    ...args: TArgs
) => TReturn;

export type AnyFn = Fn<any[], any>;

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

export type UnsubscribeFn = () => void;

export function subscribe<TItem>(list: TItem[], item: TItem): UnsubscribeFn {
    list.push(item);

    return () => {
        const idx = list.indexOf(item);

        if (idx !== -1) {
            list.splice(idx, 1);
        }
    };
}
