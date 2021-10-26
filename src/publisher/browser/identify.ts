/* eslint-env browser */

const publishersEl = document.createElement('div');
const overlayEl = createOverlay();
let documentStyleOverflow = '';
let pickPublisherCallback: ((name: string) => void) | null = null;
let publishers: string[] = [];

function createOverlay() {
    const temp = document.createElement('div');

    temp.innerHTML =
        '<div style="position:fixed;overflow:auto;top:0;left:0;bottom:0;right:0;z-index:100000000;background:rgba(255,255,255,.9);text-align:center;line-height:1.5;font-family:Tahoma,Verdana,Arial,sans-serif">' +
        '<div style="font-size:100px;font-size:33vh">#</div>' +
        '</div>';
    temp.firstChild?.appendChild(publishersEl);

    return temp.firstChild as HTMLDivElement;
}

function createButton(name: string) {
    const temp = document.createElement('div');

    temp.innerHTML =
        '<div style="margin-bottom:5px;"><button style="font-size:18px;line-height:1;padding:12px 24px;background:#3BAFDA;color:white;border:none;border-radius:3px;cursor:pointer;">' +
        name +
        '</button></div>';
    temp.firstChild?.firstChild?.addEventListener('click', () => {
        if (pickPublisherCallback !== null) {
            pickPublisherCallback(name);
        }
    });

    return temp.firstChild as HTMLDivElement;
}

function updatePublisherList() {
    if (publishers.length && pickPublisherCallback) {
        publishersEl.innerHTML = '<div style="margin-bottom:10px">Pick a publisher:</div>';
        publishersEl.append(...publishers.map((name) => createButton(name)));
    } else {
        publishersEl.innerHTML = '<div style="color:#AA0000">No rempl publishers are found</div>';
    }
}

export function startIdentify(num: string, callback: typeof pickPublisherCallback) {
    if (overlayEl.firstChild) {
        (overlayEl.firstChild as HTMLElement).innerHTML = num;
    }

    pickPublisherCallback = callback;
    updatePublisherList();
    documentStyleOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlayEl);
}

export function stopIdentify() {
    pickPublisherCallback = null;

    if (overlayEl.parentNode !== document.body) {
        return;
    }

    document.body.style.overflow = documentStyleOverflow;
    overlayEl.remove();
}

export function setPublisherList(value: string[]) {
    publishers = value;
    updatePublisherList();
}
