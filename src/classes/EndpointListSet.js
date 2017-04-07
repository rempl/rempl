var EndpointList = require('./EndpointList.js');

function EndpointListSet() {
    this.endpointLists = [];
    EndpointList.call(this, []);
}

EndpointListSet.prototype = Object.create(EndpointList.prototype);
EndpointListSet.prototype.set = function() {
    return EndpointList.prototype.set.call(
        this,
        this.endpointLists.reduce(function(result, list) {
            return result.concat(list.value);
        }, [])
    );
};

EndpointListSet.prototype.add = function(endpointList) {
    var idx = this.endpointLists.indexOf(endpointList);
    if (idx === -1) {
        this.endpointLists.push(endpointList);
        endpointList.on(this.set, this);
        this.set();
    }
};

EndpointListSet.prototype.remove = function(endpointList) {
    var idx = this.endpointLists.indexOf(endpointList);
    if (idx !== -1) {
        this.endpointLists.splice(idx, 1);
        endpointList.off(this.set, this);
        this.set();
    }
};

module.exports = EndpointListSet;
