var entity = require('basis.entity');

function stringOrNull(value) {
    return value == null ? null : String(value);
}

var Client = entity.createType('Client', {
    id: entity.StringId,
    sessionId: stringOrNull,
    type: String,
    online: Boolean,
    title: String,
    location: String,
    pid: Number,
    num: Number,
    observers: entity.createSetType('Observer'),
    features: {
        defValue: [],
        type: Array
    }
});

Client.extendReader(function(data) {
    data.observers = data.observers.map(function(observer) {
        return data.id + '/' + observer;
    });
});

module.exports = Client;
