/* eslint-env browser */
module.exports = function(root) {
    function createElement(options) {
        var element = document.createElement(options.tagName || 'div');

        for (var name in options) {
            switch (name) {
                case 'tagName':
                    break;

                case 'ref':
                    if (map) {
                        map[options.ref] = element;
                    }
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

    var map = {};
    map.element = createElement(root, map);
    return map;
};
