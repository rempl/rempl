/* eslint-env browser */

import { trustedEmptyHTML } from '../../utils/index.js';
import createElement from './createElement.js';
import styles from './style.js';

type Side = 'left' | 'top' | 'bottom' | 'right' | 'fit the page';
type View = {
    wrapper: HTMLElement;
    element: HTMLElement;
    tabs: HTMLElement;
    buttons: HTMLElement;
    sandbox: HTMLElement;
};

let publishers: string[] = [];
let selectedPublisher: string | null = null;
let selectPublisher: (id?: string) => void = () => {};
let view: View | null = null;
let onClose: () => void;

// settings persistance
const settings: Record<string, any> = {};

function setSetting(name: string, value: any) {
    settings[name] = value;
    try {
        localStorage.rempl = JSON.stringify(settings);
    } catch (e) {}
}

function updateTabSelectedState(tabEl: HTMLElement) {
    tabEl.classList.toggle('tab_selected', tabEl.getAttribute('publisher') === selectedPublisher);
}

function updatePublisherList() {
    const { tabs } = getView();

    tabs.innerHTML = trustedEmptyHTML;

    for (const publisher of publishers) {
        const { element } = createElement({
            publisher,
            class: 'tab',
            children: [publisher],
            events: {
                click() {
                    selectPublisher(publisher);
                },
            },
        });

        updateTabSelectedState(element);
        tabs.appendChild(element);
    }
}

function getView(): View {
    if (view === null) {
        const wrapperEl = document.createElement('div');
        const shadow = wrapperEl.attachShadow({ mode: 'open' });
        const styleEl = document.createElement('style');
        const content = createElement({
            class: 'host',
            children: [
                {
                    class: 'toolbar',
                    children: [
                        {
                            ref: 'tabs',
                            style: {
                                display: 'flex',
                                flex: '1',
                            },
                        },
                        {
                            ref: 'buttons',
                            class: 'layout-buttons',
                            children: [
                                ...(
                                    ['left', 'top', 'bottom', 'right', 'fit the page'] as Side[]
                                ).map((side: Side) => ({
                                    side,
                                    title: `Dock to ${side}`,
                                    class: 'layout-button',
                                    events: {
                                        click() {
                                            wrapperEl.setAttribute('side', side);
                                            setSetting('host-dock', side);
                                        },
                                    },
                                })),
                                {
                                    class: 'close-button',
                                    events: {
                                        click() {
                                            onClose?.();
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    ref: 'sandbox',
                    class: 'sandbox',
                },
            ],
        });

        try {
            Object.assign(settings, JSON.parse(localStorage.rempl || '{}'));
        } catch (e) {}

        wrapperEl.setAttribute('side', settings['host-dock'] || 'bottom');
        styleEl.append(document.createTextNode(styles));
        shadow.append(styleEl);
        shadow.append(content.element);

        view = {
            wrapper: wrapperEl,
            ...content,
        };
        updatePublisherList();
    }

    return view;
}

function showView(closeCallback: () => void): void {
    const { wrapper } = getView();

    onClose = closeCallback;

    wrapper.style.display = '';
    if (!document.contains(wrapper)) {
        (document.body || document.documentElement).append(wrapper);
    }
}

function softHideView(): void {
    getView().wrapper.style.display = 'none';
}

function hideView(): void {
    getView().wrapper.remove();
}

export default {
    show: showView,
    hide: hideView,
    softHide: softHideView,
    getSandboxContainer() {
        return getView().sandbox;
    },
    setPublisherList(publisherList: string[], selectPublisherFn: (id?: string) => void) {
        publishers = publisherList;
        selectPublisher = selectPublisherFn;
        updatePublisherList();
    },
    selectPublisher(id: string) {
        if (selectedPublisher !== id) {
            selectedPublisher = id;

            if (view) {
                Array.from(getView().tabs.children).forEach((el) =>
                    updateTabSelectedState(el as HTMLElement)
                );
            }
        }
    },
};
