var instances = Object.create(null);

module.exports = function createObserverFactory(Observer) {
    return function getObserver(id, getRemoteUI) {
        var observer = instances[id];

        if (!observer) {
            observer = instances[id] = new Observer(id, getRemoteUI);
        }

        return observer;
    }
};
