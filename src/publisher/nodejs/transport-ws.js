var fs = require('fs');
var path = require('path');
var WsTransport = require('../../transport/ws.js');
var CLIENT_ID_FILENAME = '.rempl_client_id'; // FIXME: dirty solution

function NodeWsTransport() {
    this.pid = process.pid;
    this.title = process.title;

    WsTransport.apply(this, arguments);

    // TODO make it through temp file
    if (fs.existsSync(path.resolve(CLIENT_ID_FILENAME))) {
        this.clientId = fs.readFileSync(path.resolve(CLIENT_ID_FILENAME), 'utf-8');
    }
}

NodeWsTransport.create = WsTransport.create;
NodeWsTransport.prototype = Object.create(WsTransport.prototype);

NodeWsTransport.prototype.setClientId = function(clientId) {
    WsTransport.prototype.setClientId.call(this, clientId);
    fs.writeFileSync(CLIENT_ID_FILENAME, this.clientId);
};

NodeWsTransport.prototype.type = 'node';
NodeWsTransport.prototype.clientInfoFields = WsTransport.prototype.clientInfoFields.concat(
    'pid',
    'title'
);

module.exports = NodeWsTransport;
