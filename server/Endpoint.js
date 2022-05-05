const TTL = 15 * 60 * 1000; // 15 min offline -> remove from endpoint list
const INFO_FIELDS = {
    sessionId: null,
    title: '[no title]',
    location: '[unknown]',
    pid: 0,
    type: '',
    publishers: [],
};

class Endpoint {
    constructor(list, id, socket, data) {
        this.sessionId = null;
        this.offlineTime = null;
        this.ttlTimer = null;

        this.list = list;
        this.id = id;
        this.num = 0;
        this.room = 'session-' + id;
        this.socket = socket;
        this.subscribers = [];

        for (var key in INFO_FIELDS) {
            this[key] = Object.prototype.hasOwnProperty.call(data, key)
                ? data[key]
                : INFO_FIELDS[key];
        }

        this.list.add(this);
    }

    update(data) {
        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(INFO_FIELDS, key)) {
                this[key] = data[key];
            }
        }
    }
    getData() {
        return {
            id: this.id,
            sessionId: this.sessionId,
            type: this.type,
            title: this.title,
            pid: this.pid,
            location: this.location,
            online: Boolean(this.socket),
            publishers: this.publishers || [],
            num: this.num,
        };
    }

    setOnline(socket) {
        if (!this.socket) {
            clearTimeout(this.ttlTimer);
            this.offlineTime = null;
            this.socket = socket;
            this.list.notifyUpdates();
        }
    }
    setOffline() {
        if (this.socket) {
            this.socket = null;
            this.publishers = [];
            this.offlineTime = Date.now();
            this.list.notifyUpdates();
            this.ttlTimer = setTimeout(
                function () {
                    if (!this.socket && Date.now() - this.offlineTime > TTL) {
                        this.list.remove(this);
                    }
                }.bind(this),
                TTL
            );
        }
    }

    addSubscriber(subscriber) {
        this.subscribers.push(subscriber);
        this.emitIfPossible('rempl:subscriber count changed', this.subscribers.length);
    }
    removeSubscriber(subscriber) {
        var index = this.subscribers.indexOf(subscriber);
        if (index !== -1) {
            this.subscribers.splice(index, 1);
            this.emitIfPossible('rempl:subscriber count changed', this.subscribers.length);
        }
    }

    emitIfPossible() {
        if (this.socket) {
            this.emit.apply(this, arguments);
        }
    }
    emit() {
        if (!this.socket) {
            return console.warn('[rempl] Endpoint ' + this.id + ' is offline');
        }

        // console.log('socket', 'send to ' + this.id + ' ' + JSON.stringify(arguments), true);
        this.socket.emit.apply(this.socket, arguments);
    }
}

module.exports = Endpoint;
