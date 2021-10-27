import { AnyFn, Fn } from '../utils/index.js';

export type Handler = {
    fn: AnyFn;
    context: unknown;
    handler: Handler | null;
};

export default class Token<TValue> {
    value: TValue;
    handler: Handler | null = null;

    constructor(value: TValue) {
        this.value = value;
    }

    /**
     * Set new value and call apply method if value has been changed.
     */
    set(value: TValue): void {
        if (this.value !== value) {
            this.value = value;
            this.apply();
        }
    }

    /**
     * Returns current token value.
     */
    get(): TValue {
        return this.value;
    }

    /**
     * Adds a callback on token value changes.
     */
    on<TContext>(fn: Fn<[TValue], unknown, TContext>, context?: TContext): void {
        // todo rework
        let cursor: Handler | null = this as unknown as Handler;
        while ((cursor = cursor.handler)) {
            if (cursor.fn === fn && cursor.context === context) {
                console.warn('Token#on: duplicate fn & context pair');
            }
        }

        this.handler = {
            fn: fn as AnyFn,
            context: context,
            handler: this.handler,
        };
    }

    /**
     * Adds a callback on token value changes and invokes callback with current value.
     */
    link<TContext>(fn: Fn<[TValue], unknown, TContext>, context?: TContext): void {
        this.on(fn, context);
        fn.call(context as TContext, this.value);
    }

    /**
     * Removes a callback. Must be passed the same arguments as for Token#on() method.
     */
    off(fn: AnyFn, context?: unknown): void {
        // todo rework
        let cursor: Handler | null = this as unknown as Handler;
        let prev;

        while (((prev = cursor), (cursor = cursor.handler))) {
            if (cursor.fn === fn && cursor.context === context) {
                // make it non-callable
                cursor.fn = function () {};

                // remove from list
                prev.handler = cursor.handler;

                return;
            }
        }

        console.warn('Token#off: fn & context pair not found, nothing was removed');
    }

    /**
     * Call all callbacks with current token value.
     */
    apply(): void {
        // todo rework
        let cursor: Handler | null = this as unknown as Handler;

        while ((cursor = cursor.handler)) {
            cursor.fn.call(cursor.context, this.value);
        }
    }
}
