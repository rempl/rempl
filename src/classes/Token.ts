const noop = () => {};

type Handler<T> = (value: T) => void;
type HandlerListItem<T> = {
    fn: Handler<T> | typeof noop;
    context?: any;
    handler: HandlerListItem<T> | null;
}

// TODO: Rework for accessors, i.e. token.set(value) => token.value = value
export class Token<T> {
    value: T;
    handler: HandlerListItem<T>;

    constructor(value: T) {
        this.value = value;
        this.handler = null;
    }

    set(value: T) {
        if (!Object.is(this.value, value)) {
            this.value = value;

            let cursor = this as unknown as HandlerListItem<T>;
            while (cursor = cursor.handler) {
                cursor.fn.call(cursor.context, this.value);
            }    
        }
    }

    get(): T {
        return this.value;
    }

    // Adds a callback on token value changes.
    on(fn: Handler<T>, context?: any) {
        let cursor = this as unknown as HandlerListItem<T>;

        while (cursor = cursor.handler) {
            if (cursor.fn === fn && cursor.context === context) {
                console.warn('Token#on: duplicate fn & context pair');
            }
        }

        this.handler = {
            fn,
            context,
            handler: this.handler
        };
    }

    // Adds a callback on token value changes and invokes callback with current value.
    link(fn: Handler<T>, context?: any) {
        this.on(fn, context);
        fn.call(context, this.value);
    }

    // Removes a callback. Must be passed the same arguments as for Token#on() method.
    off(fn: Handler<T>, context?: any) {
        let cursor = this as unknown as HandlerListItem<T>;
        let prev;

        while (prev = cursor, cursor = cursor.handler) {
            if (cursor.fn === fn && cursor.context === context) {
                // make it non-callable
                cursor.fn = noop;

                // remove from list
                prev.handler = cursor.handler;

                return;
            }
        }

        console.warn('Token#off: fn & context pair not found, nothing was removed');
    }
}
