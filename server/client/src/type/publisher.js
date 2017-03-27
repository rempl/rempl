var entity = require('basis.entity');

var Publisher = entity.createType('Publisher', {
    id: entity.StringId,
    endpointId: entity.calc('id', function(id) {
        return id.split(/\//)[0];
    }),
    name: entity.calc('id', function(id) {
        return id.split(/\//)[1];
    })
});

module.exports = Publisher;
