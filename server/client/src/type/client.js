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
    providers: entity.createSetType('Provider'),
    features: {
        defValue: [],
        type: Array
    }
});

Client.extendReader(function(data) {
    data.providers = data.providers.map(function(observer) {
        return data.id + '/' + observer;
    });
});

module.exports = Client;
