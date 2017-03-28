/* eslint-env browser */
var utils = require('../../utils/index.js');
var createSandbox = require('../../sandbox/index.js');
var sandbox = null;
var view = null;

function createElement(options) {
    var element = document.createElement(options.tagName || 'div');

    for (var name in options) {
        switch (name) {
            case 'tagName':
                break;

            case 'style':
                element.style = Object.keys(options.style).reduce(function(style, property) {
                    return style + property + ':' + options.style[property] + ';';
                }, '');
                break;

            case 'events':
                for (var event in options.events) {
                    element.addEventListener(event, options.events[event], false);
                }
                break;

            case 'children':
                options.children.forEach(function(child) {
                    element.appendChild(
                        typeof child === 'string'
                            ? document.createTextNode(child)
                            : createElement(child)
                    );
                });
                break;

            default:
                element.setAttribute(name, options[name]);
        }
    }

    return element;
}

function getView() {
    if (view === null) {
        var id = utils.genUID();
        view = createElement({
            id: id,
            style: {
                position: 'fixed',
                'z-index': 100000,
                display: 'flex',
                'flex-direction': 'column',
                left: 0,
                right: 0,
                bottom: 0,
                height: '50%',
                'border-top': '2px solid #AAA',
                background: '#EEE',
                opacity: .9
            },
            children: [
                {
                    tagName: 'style',
                    children: [
                        '#' + id + ' iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;background:white}'
                    ]
                },
                {
                    style: {
                        padding: '4px',
                        background: '#EEE'
                    },
                    children: ['close'],
                    events: {
                        click: function() {
                            hideView();
                            cleanupSandbox();
                        }
                    }
                },
                {
                    style: {
                        flex: 1,
                        position: 'relative'
                    }
                }
            ]
        });
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
    injectElement(document.body, getView());
}

function hideView() {
    getView().remove();
}

function cleanupSandbox() {
    if (sandbox !== null) {
        sandbox.destroy();
        sandbox = null;
    }
}

module.exports = function createHost() {
    // supported only in browser env
    if (typeof document === 'undefined') {
        return;
    }

    return {
        activate: function(publisher, callback) {
            showView();
            publisher.getRemoteUI({}, function(error, type, content) {
                cleanupSandbox();
                sandbox = createSandbox({
                    container: view.lastChild,
                    type: type,
                    content: content
                }, function(api) {
                    callback(api);
                    api.send({
                        type: 'publisher:connect'
                    });
                });
            });
        },
        deactivate: function() {
            hideView();
            cleanupSandbox();
        }
    };
};
