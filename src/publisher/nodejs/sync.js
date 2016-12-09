var noop = function() {};

module.exports = function createSync(publisher, client) {
    var remoteApi = client.createApi(publisher.id, publisher.getRemoteUI);

    remoteApi.subscribe(publisher.processInput);
    remoteApi.connected.attach(function(connected) {
        publisher.channels.wsserver = connected ? remoteApi.send : noop;
    });

    return publisher;
};
