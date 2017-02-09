function List(server) {
    this.connections = [];
    this.server = server;
}

List.prototype = {
    get: function(property, value) {
        for (var i = 0; i < this.connections.length; i++) {
            if (this.connections[i][property] === value) {
                return this.connections[i];
            }
        }

        return null;
    },
    add: function(connection) {
        if (this.connections.indexOf(connection) === -1) {
            this.connections.push(connection);
            this.notifyUpdates();
        }
    },
    remove: function(connection) {
        var index = this.connections.indexOf(connection);
        if (index !== -1) {
            this.connections.splice(index, 1);
            this.notifyUpdates();
        }
    },
    forEach: function(fn, context) {
        this.connections.forEach(fn, context);
    },
    notifyUpdates: function() {
        // TODO: notify subscribers
        this.server.emit('rempl:endpointList', this.getList());
    },
    broadcast: function() {
        var args = arguments;
        this.forEach(function(connection) {
            connection.emitIfPossible.apply(connection, args);
        });
    },
    getList: function() {
        return this.connections.map(function(connection) {
            return connection.getData();
        });
    }
};

module.exports = List;
