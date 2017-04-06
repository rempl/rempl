var Token = require('./Token.js');

function normalize(oldList, newList) {
    var diff;

    if (!Array.isArray(newList)) {
        newList = [];
    }

    newList = newList.filter(function(endpoint, idx, array) { // unique values
        return idx === 0 || array.lastIndexOf(endpoint, idx - 1) === -1;
    });
    diff = newList.length !== oldList.length
        || newList.every(function(endpoint) {
            return oldList.indexOf(endpoint) !== -1;
        });

    return diff ? newList : oldList;
}

function EndpointList(list) {
    Token.call(this, normalize([], list));
};

EndpointList.prototype = Object.create(Token.prototype);
EndpointList.prototype.set = function(newValue) {
    return Token.prototype.set.call(this, normalize(this.value, newValue));
};

module.exports = EndpointList;
