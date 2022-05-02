export type OnChangeCallback<TContext, T> = (this: TContext, value: T) => void;
export type Handler<T> = {
    fn(value: T): void;
    context: unknown;
    handler: Handler<T> | null;
};

export default class ReactiveValue<T> {
    value: T;
    handler: Handler<T> | null = null;

    constructor(value: T) {
        this.value = value;
    }

    /**
     * Set new value and call apply method if value has been changed.
     */
    set(value: T): void {
        if (!Object.is(this.value, value)) {
            this.value = value;
            this.apply();
        }
    }

    /**
     * Returns current token value.
     */
    get(): T {
        return this.value;
    }

    /**
     * Adds a callback on token value changes.
     */
    on<TContext>(fn: OnChangeCallback<TContext, T>, context?: TContext): void {
        let cursor = this.handler;

        while (cursor !== null) {
            if (cursor.fn === fn && cursor.context === context) {
                console.warn('ReactiveValue#on: duplicate fn & context pair');
            }

            cursor = cursor.handler;
        }

        this.handler = {
            fn,
            context,
            handler: this.handler,
        };
    }

    /**
     * Adds a callback on token value changes and invokes callback with current value.
     */
    link<TContext>(fn: OnChangeCallback<TContext, T>, context?: TContext): void {
        this.on(fn, context);
        fn.call(context as TContext, this.value);
    }

    /**
     * Removes a callback. Must be passed the same arguments as for ReactiveValue#on() method.
     */
    off<TContext>(fn: OnChangeCallback<TContext, T>, context?: TContext): void {
        // todo rework
        let cursor = this.handler;
        let prev: Handler<T> | this = this;

        while (cursor !== null) {
            if (cursor.fn === fn && cursor.context === context) {
                // make it non-callable
                cursor.fn = function () {};

                // remove from list
                prev.handler = cursor.handler;

                return;
            }

            prev = cursor;
            cursor = cursor.handler;
        }

        console.warn('ReactiveValue#off: fn & context pair not found, nothing was removed');
    }

    /**
     * Call all callbacks with current token value.
     */
    apply(): void {
        // todo rework
        let cursor = this.handler;

        while (cursor !== null) {
            cursor.fn.call(cursor.context, this.value);
            cursor = cursor.handler;
        }
    }
}
