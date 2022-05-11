/* eslint-env browser */

import createElement from './createElement.js';
import { AnyFn, global } from '../../utils/index.js';
import styles from './style.js';

type Side = 'left' | 'top' | 'bottom' | 'right' | 'fit the page';
type View = {
    wrapper: HTMLDivElement;
    element: HTMLDivElement;
    tabs: HTMLDivElement;
    buttons: HTMLDivElement;
    sandbox: HTMLDivElement;
};

let publishers: string[] = [];
let selectedPublisher: string | null = null;
let selectPublisher: (id?: string) => void = () => {};
let view: View | null = null;
let onClose: AnyFn;

// settings persistance
const settingsStorage = global.localStorage || {};
let settings: Record<string, any> = {};
try {
    settings = JSON.parse(settingsStorage.rempl || '{}');
} catch (e) {
    // ignore
}

function setSetting(name: string, value: any) {
    settings[name] = value;
    settingsStorage.rempl = JSON.stringify(settings);
}

function updateTabSelectedState(tabEl: HTMLElement) {
    tabEl.classList.toggle('tab_selected', tabEl.getAttribute('publisher') === selectedPublisher);
}

function updatePublisherList() {
    const { tabs } = getView();

    tabs.innerHTML = '';

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

        wrapperEl.setAttribute('side', settings['host-dock'] || 'bottom');
        styleEl.append(document.createTextNode(styles));
        shadow.append(styleEl);
        shadow.append(content.element);

        view = {
            wrapper: wrapperEl,
            ...content,
        } as View;
        updatePublisherList();
    }

    return view;
}

function showView(closeCallback: AnyFn): void {
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
    getSandboxContainer(): HTMLDivElement {
        return getView().sandbox;
    },
    setPublisherList(publisherList: string[], selectPublisherFn: (id?: string) => void): void {
        publishers = publisherList;
        selectPublisher = selectPublisherFn;
        updatePublisherList();
    },
    selectPublisher(id: string): void {
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
