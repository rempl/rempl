/* eslint-env browser */
/* global asset */

var createElement = require('./createElement.js');
var uid = require('../../utils/index.js').genUID();
var publishers = [];
var selectedPublisher = null;
var selectPublisher;
var view = null;
var onClose;

// settings persistance
var settingsStorage = global.localStorage || {};
var settings = {};
try {
    settings = JSON.parse(settingsStorage.rempl || '{}');
} catch (e) {}

function setSetting(name, value) {
    settings[name] = value;
    settingsStorage.rempl = JSON.stringify(settings);
}

function updateTabSelectedState(tabEl) {
    tabEl.classList.toggle(
        isolateName('tab_selected'),
        tabEl.getAttribute('publisher') === selectedPublisher
    );
}

function updatePublisherList() {
    var list = getView().tabs;
    list.innerHTML = '';
    publishers.forEach(function(publisher) {
        var tabEl = createElement({
            publisher: publisher,
            class: isolateName('tab'),
            children: [publisher],
            events: {
                click: function() {
                    selectPublisher(publisher);
                }
            }
        }).element;
        updateTabSelectedState(tabEl, selectedPublisher);
        list.appendChild(tabEl);
    });
}

function createLayoutButton(side, onclick) {
    return {
        side: side,
        title: 'Dock to ' + side,
        class: isolateName('layout-button'),
        events: {
            click: typeof onclick === 'function' ? onclick : function() {
                view.element.setAttribute('side', side);
                setSetting('host-dock', side);
            }
        }
    };
}

function isolateName(name) {
    return uid + '-' + name;
}

function preprocessCSS(css) {
    return css.replace(/\.([a-z])/gi, '.' + isolateName('$1'));
}

function getView() {
    if (view === null) {
        view = createElement({
            class: isolateName('host'),
            side: settings['host-dock'] || 'bottom',
            children: [
                {
                    tagName: 'style',
                    children: [
                        preprocessCSS(
                            typeof asset === 'function'
                                ? asset('./style.css', true)
                                : require('fs').readFileSync(__dirname + '/style.css', 'utf8')
                        )
                    ]
                },
                {
                    class: isolateName('toolbar'),
                    children: [
                        {
                            ref: 'tabs',
                            style: {
                                display: 'flex',
                                flex: 1
                            }
                        },
                        {
                            ref: 'buttons',
                            class: isolateName('layout-buttons'),
                            children: [].concat(
                                ['left', 'top', 'bottom', 'right', 'fit the page'].map(createLayoutButton),
                                {
                                    class: isolateName('close-button'),
                                    events: {
                                        click: function() {
                                            onClose();
                                        }
                                    }
                                }
                            )
                        }
                    ]
                },
                {
                    ref: 'sandbox',
                    class: isolateName('sandbox')
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

function showView(closeCallback) {
    var element = getView().element;

    onClose = closeCallback;

    element.style.display = '';
    if (!document.contains(element)) {
        injectElement(document.body || document.documentElement, element);
    }
}

function softHideView() {
    getView().element.style.display = 'none';
}

function hideView() {
    getView().element.remove();
}

module.exports = {
    show: showView,
    hide: hideView,
    softHide: softHideView,
    getSandboxContainer: function() {
        return getView().sandbox;
    },
    setPublisherList: function(publisherList, selectPublisherFn) {
        publishers = publisherList;
        selectPublisher = selectPublisherFn;
        updatePublisherList();
    },
    selectPublisher: function(publisher) {
        if (publisher !== selectedPublisher) {
            selectedPublisher = publisher;
            if (view) {
                Array.prototype.forEach.call(getView().tabs.children, updateTabSelectedState);
            }
        }
    }
};
