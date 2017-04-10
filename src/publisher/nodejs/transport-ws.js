var fs = require('fs');
var path = require('path');
var WsTransport = require('../../transport/ws-publisher.js');
var CLIENT_ID_FILENAME = '.rempl_endpoint_id'; // FIXME: dirty solution
var envUri = process.env.REMPL_SERVER;
var defaultUri = envUri
    ? (String(envUri).toLowerCase() !== 'none' ? envUri : false)
    : 'ws://localhost:8177';

function NodeWsTransport(uri) {
    WsTransport.call(this, uri);

    // TODO make it through temp file
    if (fs.existsSync(path.resolve(CLIENT_ID_FILENAME))) {
        this.id = fs.readFileSync(path.resolve(CLIENT_ID_FILENAME), 'utf-8');
    }
}

NodeWsTransport.defaultUri = defaultUri;
NodeWsTransport.get = WsTransport.get;
NodeWsTransport.prototype = Object.create(WsTransport.prototype);

NodeWsTransport.prototype.setClientId = function(id) {
    WsTransport.prototype.setClientId.call(this, id);
    fs.writeFileSync(CLIENT_ID_FILENAME, this.id);
};

NodeWsTransport.prototype.type = 'node';
NodeWsTransport.prototype.infoFields = WsTransport.prototype.infoFields.concat(
    'pid',
    'title'
);
NodeWsTransport.prototype.getInfo = function() {
    this.pid = process.pid;
    this.title = process.title;
    return WsTransport.prototype.getInfo.call(this);
};

module.exports = NodeWsTransport;
