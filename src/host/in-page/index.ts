/* eslint-env browser */
import EventTransport from '../../transport/event.js';
import { createSandbox } from '../../sandbox/index.js';
import view from './view.js';
import Publisher from '../../classes/Publisher.js';

type Host = {
    activate(publisher?: Publisher | string): void;
    deactivate(publisher?: Publisher | string): void;
};

const publishers: string[] = [];
let selectedPublisherId: string | null = null;
let autoSelectPublisher = false;
let teardownTimer: ReturnType<typeof setTimeout>;
let transport: EventTransport | null = null;
let sandbox: ReturnType<typeof createSandbox> | null = null;
let host: Host | null = null;

function cleanupSandbox() {
    if (sandbox !== null) {
        sandbox.destroy();
        sandbox = null;
    }
}

function selectPublisher(publisherId?: string | null) {
    if (!publisherId) {
        publisherId = null;
    }

    if (publisherId !== selectedPublisherId) {
        autoSelectPublisher = false;
        selectedPublisherId = publisherId;

        if (selectedPublisherId) {
            view.selectPublisher(selectedPublisherId);
            view.show(host.deactivate);
            transport.onInit({ id: selectedPublisherId }, function (papi) {
                papi.getRemoteUI(function (error, type, content) {
                    cleanupSandbox();
                    sandbox = createSandbox(
                        {
                            container: view.getSandboxContainer(),
                            type: type,
                            content: content,
                        },
                        (api) => {
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
    transport.remoteEndpoints.on((endpoints) => {
        console.log('?!', { endpoints });
        publishers = endpoints;
        view.setPublisherList(publishers, selectPublisher);

        if (autoSelectPublisher && !selectedPublisherId && publishers.length) {
            selectPublisher(publishers[0]);
        }
    });

    return (host = {
        activate(publisher) {
            const publisherId =
                typeof publisher === 'string'
                    ? publisher
                    : publisher?.id || selectedPublisherId || publishers[0] || null;

            clearTimeout(teardownTimer);
            selectPublisher(publisherId);
            view.show(host?.deactivate);

            if (!selectedPublisherId) {
                autoSelectPublisher = true;
            }
        },
        deactivate(publisher) {
            const publisherId = typeof publisher === 'string' ? publisher : publisher?.id || null;

            autoSelectPublisher = false;

            if (!publisherId || publisherId === selectedPublisherId) {
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
