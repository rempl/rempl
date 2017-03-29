/* eslint-env browser */
var EventTransport = require('../../transport/event.js');
var createSandbox = require('../../sandbox/index.js');
var createElement = require('./createElement.js');
var publishers = [];
var selectedPublisher = null;
var transport = null;
// var externalWindow = null;
var sandbox = null;
var view = null;
var host = null;

function updatePublisherList() {
    var list = getView().tabs;
    list.innerHTML = '';
    publishers.forEach(function(publisher) {
        list.appendChild(createElement({
            publisher: publisher,
            class: publisher === selectedPublisher ? 'tab tab_selected' : 'tab',
            children: [publisher],
            events: {
                click: function() {
                    selectPublisher(publisher);
                }
            }
        }).element);
    });
}

function getView() {
    if (view === null) {
        view = createElement({
            class: 'host',
            children: [
                {
                    tagName: 'style',
                    children: [require('./style.js')]
                },
                {
                    class: 'toolbar',
                    children: [
                        {
                            ref: 'tabs',
                            style: {
                                display: 'flex',
                                flex: 1
                            }
                        },
                        {
                            children: [
                                {
                                    class: 'button',
                                    children: ['close'],
                                    events: {
                                        click: function() {
                                            selectPublisher();
                                        }
                                    }
                                }
                                // {
                                //     class: 'button',
                                //     children: ['open'],
                                //     events: {
                                //         click: function() {
                                //             if (externalWindow === null || externalWindow.closed) {
                                //                 externalWindow = window.open('about:blank', 'rempl');
                                //                 _publisher.getRemoteUI({}, function(error, type, content) {
                                //                     cleanupSandbox();
                                //                     sandbox = createSandbox({
                                //                         container: view.sandbox,
                                //                         type: type,
                                //                         content: content,
                                //                         window: externalWindow
                                //                     }, function(api) {
                                //                         _callback(api);
                                //                         api.send({
                                //                             type: 'publisher:connect'
                                //                         });
                                //                     });
                                //                 });
                                //             } else {
                                //                 externalWindow.focus();
                                //             }
                                //         }
                                //     }
                                // }
                            ]
                        }
                    ]
                },
                {
                    ref: 'sandbox',
                    class: 'sandbox'
                }
            ]
        });

        updatePublisherList();
    }

    return view;
}

function injectElement(container, element) {
    if (!container) {
        container = document.documentElement;
    }

    return container.appendChild(element);
}

function showView() {
    injectElement(document.body, getView().element);
}

function hideView() {
    getView().element.remove();
}

function cleanupSandbox() {
    if (sandbox !== null) {
        sandbox.destroy();
        sandbox = null;
    }
}

function selectPublisher(publisher) {
    if (publisher !== selectedPublisher) {
        selectedPublisher = publisher;
        Array.prototype.slice.call(getView().tabs.children).forEach(function(tab) {
            tab.classList.toggle('tab_selected', tab.getAttribute('publisher') === selectedPublisher);
        });

        if (selectedPublisher) {
            showView();
            transport.onInit({ id: selectedPublisher }, function(papi) {
                papi.getRemoteUI(function(error, type, content) {
                    cleanupSandbox();
                    sandbox = createSandbox({
                        container: view.sandbox,
                        type: type,
                        content: content
                    }, function(api) {
                        papi.subscribe(api.send);
                        api.subscribe(papi.send);
                        api.send({
                            type: 'publisher:connect'
                        });
                    });
                });
            });
        } else {
            hideView();
            cleanupSandbox();
        }
    }
}

module.exports = function getHost() {
    // supported only in browser env
    if (typeof document === 'undefined') {
        return;
    }

    if (host !== null) {
        return host;
    }

    // disable it by default since it's a basic implementation
    // if (true) {
    //     return;
    // }

    transport = new EventTransport('rempl-inpage-host', 'rempl-inpage-publisher')
        .onPublishersChanged(function(endpointPublishers) {
            publishers = endpointPublishers;
            updatePublisherList();
        });

    return host = {
        activate: function(publisherId) {
            selectPublisher(publisherId);
        },
        deactivate: function() {
            selectPublisher();
        }
    };
};
