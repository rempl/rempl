export type TODO = any;

export const isNode =
    typeof process !== "undefined" &&
    Object.prototype.toString.call(process) === "[object process]" &&
    Object.prototype.toString.call(global.self) !== "[object Window]";

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

export function slice(src: unknown[], offset?: number): unknown[] {
    return Array.prototype.slice.call(src, offset);
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

const consoleMethods = (() => {
    const console = global.console;
    const methods: Pick<typeof console, "log" | "info" | "warn" | "error"> = {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
    };

    if (console) {
        for (const key of Object.keys(methods)) {
            const methodName = key as keyof typeof methods;
            methods[methodName] =
                "bind" in Function.prototype &&
                typeof console[methodName] == "function"
                    ? Function.prototype.bind.call(console[methodName], console)
                    : // IE8 and lower solution. It's also more safe when Function.prototype.bind
                      // defines by other libraries (like es5-shim).
                      function (...args) {
                          Function.prototype.apply.call(
                              console[methodName],
                              console,
                              args
                          );
                      };
        }
    }

    return methods;
})();

export function hasOwnProperty(obj: TypeRecord, prop: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

export const log = consoleMethods.log;
export const info = consoleMethods.info;
export const warn = consoleMethods.warn;
export const error = consoleMethods.error;
