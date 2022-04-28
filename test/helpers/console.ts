import { deepEqual } from 'assert';

const methods = ['log', 'info', 'warn', 'error'];

export default function (fn: () => void, expected: any) {
    const messages = [];
    const original = methods.reduce((original, name) => {
        original[name] = console[name];
        console[name] = (...args: any[]) =>
            messages.push({
                type: name,
                args,
            });

        return original;
    }, {});

    try {
        fn();
        deepEqual(messages, expected);
    } finally {
        // restore
        methods.forEach(function (name) {
            console[name] = original[name];
        });
    }
}
