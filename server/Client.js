var TTL = 15 * 60 * 1000; // 15 min offline -> remove from client list
var CLIENT_FIELDS = {
    sessionId: null,
    title: '[no title]',
    location: '[unknown]',
    pid: 0,
    type: '',
    features: [],
    providers: []
};

function Client(list, id, socket, data) {
    this.list = list;
    this.id = id;
    this.num = 0;
    this.room = 'session-' + id;
    this.socket = socket;
    this.customers = [];

    for (var key in CLIENT_FIELDS) {
        this[key] = Object.prototype.hasOwnProperty.call(data, key)
            ? data[key]
            : CLIENT_FIELDS[key];
    }

    this.list.add(this);
}

Client.prototype = {
    list: null,
    id: null,
    sessionId: null,
    num: null,
    room: null,
    socket: null,
    offlineTime: null,
    ttlTimer: null,
    devtoolCount: 0,

    update: function(data) {
        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(CLIENT_FIELDS, key)) {
                this[key] = data[key];
            }
        }
    },
    getData: function() {
        return {
            id: this.id,
            sessionId: this.sessionId,
            type: this.type,
            title: this.title,
            pid: this.pid,
            location: this.location,
            online: Boolean(this.socket),
            features: this.features || [],
            providers: this.providers || [],
            num: this.num
        };
    },

    setOnline: function(socket) {
        if (!this.socket) {
            clearTimeout(this.ttlTimer);
            this.offlineTime = null;
            this.socket = socket;
            this.list.notifyUpdates();
        }
    },
    setOffline: function() {
        if (this.socket) {
            this.socket = null;
            this.features = [];
            this.providers = [];
            this.offlineTime = Date.now();
            this.list.notifyUpdates();
            this.ttlTimer = setTimeout(function() {
                if (!this.socket && (Date.now() - this.offlineTime) > TTL) {
                    this.list.remove(this);
                }
            }.bind(this), TTL);
        }
    },

    addCustomer: function(customer) {
        this.customers.push(customer);
        this.emitIfPossible('devtool:customer count changed', this.customers.length);
    },
    removeCustomer: function(customer) {
        var index = this.customers.indexOf(customer);
        if (index !== -1) {
            this.customers.splice(index, 1);
            this.emitIfPossible('devtool:customer count changed', this.customers.length);
        }
    },

    emitIfPossible: function() {
        if (this.socket) {
            this.emit.apply(this, arguments);
        }
    },
    emit: function() {
        if (!this.socket) {
            return console.warn('[rempl] Client ' + this.id + ' is offline');
        }

        // console.log('socket', 'send to ' + this.id + ' ' + JSON.stringify(arguments), true);
        this.socket.emit.apply(this.socket, arguments);
    }
};

module.exports = Client;
