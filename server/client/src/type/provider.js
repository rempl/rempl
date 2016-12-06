var entity = require('basis.entity');

function stringOrNull(value) {
    return value == null ? null : String(value);
}

var Provider = entity.createType('Provider', {
    id: entity.StringId,
    clientId: entity.calc('id', function(id) {
        return id.split(/\//)[0];
    }),
    name: entity.calc('id', function(id) {
        return id.split(/\//)[1];
    }),
    uiType: stringOrNull,
    uiContent: stringOrNull
});

module.exports = Provider;
