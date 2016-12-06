var noop = function() {};

module.exports = function createSync(provider, client) {
    var remoteApi = client.createApi(provider.id, provider.getRemoteUI);

    remoteApi.subscribe(provider.processInput);
    remoteApi.connected.attach(function(connected) {
        provider.channels.wsserver = connected ? remoteApi.send : noop;
    });

    return provider;
};
