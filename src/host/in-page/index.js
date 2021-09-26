/* eslint-env browser */
var EventTransport = require('../../transport/event.js');
var createSandbox = require('../../sandbox/index.js');
var view = require('./view.js');
var publishers = [];
var selectedPublisher = null;
var autoSelectPublisher = false;
var teardownTimer;
var transport = null;
var sandbox = null;
var host = null;

function cleanupSandbox() {
    if (sandbox !== null) {
        sandbox.destroy();
        sandbox = null;
    }
}

function selectPublisher(publisher) {
    if (!publisher) {
        publisher = null;
    }

    if (publisher !== selectedPublisher) {
        autoSelectPublisher = false;
        selectedPublisher = publisher;

        if (selectedPublisher) {
            view.selectPublisher(selectedPublisher);
            view.show(host.deactivate);
            transport.onInit({ id: selectedPublisher }, function (papi) {
                papi.getRemoteUI(function (error, type, content) {
                    cleanupSandbox();
                    sandbox = createSandbox(
                        {
                            container: view.getSandboxContainer(),
                            type: type,
                            content: content,
                        },
                        function (api) {
                            papi.subscribe(api.send);
                            api.subscribe(papi.send);
                        }
                    );
                    sandbox.setConnected(true);
                });
            });
        } else {
            view.hide();
            cleanupSandbox();
        }
    }
}

module.exports = function getHost() {
    if (host !== null) {
        return host;
    }

    transport = new EventTransport('rempl-inpage-host', 'rempl-inpage-publisher');
    transport.remoteEndpoints.on(function (endpoints) {
        publishers = endpoints;
        view.setPublisherList(publishers, selectPublisher);

        if (autoSelectPublisher && !selectedPublisher && publishers.length) {
            selectPublisher(publishers[0]);
        }
    });

    return (host = {
        activate: function (publisher) {
            var publisherId =
                (publisher && publisher.id) ||
                publisher ||
                selectedPublisher ||
                publishers[0] ||
                null;

            clearTimeout(teardownTimer);
            selectPublisher(publisherId);
            view.show(host.deactivate);

            if (!selectedPublisher) {
                autoSelectPublisher = true;
            }
        },
        deactivate: function (publisher) {
            var publisherId = (publisher && publisher.id) || publisher;
            autoSelectPublisher = false;

            if (!publisherId || publisherId === selectedPublisher) {
                view.softHide();
                // tear down subscriber in 15 sec
                clearTimeout(teardownTimer);
                teardownTimer = setTimeout(function () {
                    selectPublisher();
                }, 15000);
            }
        },
    });
};
