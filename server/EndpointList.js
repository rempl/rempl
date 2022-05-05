module.exports = class List {
    constructor(server) {
        this.connections = [];
        this.server = server;
    }

    get(property, value) {
        for (var i = 0; i < this.connections.length; i++) {
            if (this.connections[i][property] === value) {
                return this.connections[i];
            }
        }

        return null;
    }
    add(connection) {
        if (this.connections.indexOf(connection) === -1) {
            this.connections.push(connection);
            this.notifyUpdates();
        }
    }
    remove(connection) {
        var index = this.connections.indexOf(connection);
        if (index !== -1) {
            this.connections.splice(index, 1);
            this.notifyUpdates();
        }
    }
    forEach(fn, context) {
        this.connections.forEach(fn, context);
    }
    notifyUpdates() {
        // TODO: notify subscribers
        this.server.emit('rempl:endpointList', this.getList());
    }
    broadcast() {
        var args = arguments;
        this.forEach(function (connection) {
            connection.emitIfPossible.apply(connection, args);
        });
    }
    getList() {
        return this.connections.map(function (connection) {
            return connection.getData();
        });
    }
};
