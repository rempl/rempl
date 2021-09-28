// adopted from core-js
// https://github.com/zloirock/core-js/blob/71adeb4a264f77df25931582493a290b94cd9c48/packages/core-js/internals/global.js

function check(it: any) {
    return it && it.Math == Math && it;
}

const resolvedGlobal =
    check(typeof globalThis == 'object' && globalThis) ||
    check(typeof window == 'object' && window) ||
    check(typeof self == 'object' && self) ||
    check(typeof global == 'object' && global) ||
    (function () {
        return this;
    })() ||
    Function('return this')();

export default resolvedGlobal;
