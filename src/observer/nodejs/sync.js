var noop = function() {};

module.exports = function createSync(observer, client) {
    var remoteApi = client.createApi(observer.id, observer.getRemoteUI);

    remoteApi.subscribe(observer.processInput);
    remoteApi.connected.attach(function(connected) {
        observer.channels.wsserver = connected ? remoteApi.send : noop;
    });

    return observer;
};
