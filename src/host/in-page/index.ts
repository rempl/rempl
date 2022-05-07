/* eslint-env browser */
import EventTransport from '../../transport/event.js';
import createSandbox from '../../sandbox/browser/index.js';
import { Publisher } from '../../classes/Publisher.js';
import view from './view.js';

type Host = {
    activate(publisher?: Publisher | string): void;
    deactivate(publisher?: Publisher | string): void;
};

let publishers: string[] = [];
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

function selectPublisher(publisherId: string | null = null) {
    if (!publisherId) {
        publisherId = null;
    }

    if (publisherId !== selectedPublisherId) {
        autoSelectPublisher = false;
        selectedPublisherId = publisherId;

        if (selectedPublisherId) {
            view.selectPublisher(selectedPublisherId);
            view.show((host as Host).deactivate);
            (transport as EventTransport).onInit({ id: selectedPublisherId }, function (papi) {
                papi.getRemoteUI(function (error, type, content) {
                    cleanupSandbox();
                    sandbox = createSandbox(
                        {
                            container: view.getSandboxContainer(),
                            type,
                            content,
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

export default function getHost() {
    if (host !== null) {
        return host;
    }

    transport = EventTransport.get('rempl-inpage-host', 'rempl-inpage-publisher');
    transport.remoteEndpoints.on((endpoints) => {
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
            view.show((host as Host).deactivate);

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
}
