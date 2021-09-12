/* eslint-env browser */

var publishersEl = document.createElement("div");
var overlayEl = createOverlay();
var documentStyleOverflow;
var pickPublisherCallback;
var publishers = [];

function createOverlay() {
    var temp = document.createElement("div");
    temp.innerHTML =
        '<div style="position:fixed;overflow:auto;top:0;left:0;bottom:0;right:0;z-index:100000000;background:rgba(255,255,255,.9);text-align:center;line-height:1.5;font-family:Tahoma,Verdana,Arial,sans-serif">' +
        '<div style="font-size:100px;font-size:33vh">#</div>' +
        "</div>";
    temp.firstChild.appendChild(publishersEl);
    return temp.firstChild;
}

function createButton(name) {
    var temp = document.createElement("div");
    temp.innerHTML =
        '<div style="margin-bottom:5px;"><button style="font-size:18px;line-height:1;padding:12px 24px;background:#3BAFDA;color:white;border:none;border-radius:3px;cursor:pointer;">' +
        name +
        "</button></div>";
    temp.firstChild.firstChild.onclick = function () {
        pickPublisherCallback(name);
    };
    return temp.firstChild;
}

function updatePublisherList() {
    if (publishers.length && pickPublisherCallback) {
        publishersEl.innerHTML =
            '<div style="margin-bottom:10px">Pick a publisher:</div>';
        for (var i = 0; i < publishers.length; i++) {
            publishersEl.appendChild(createButton(publishers[i]));
        }
    } else {
        publishersEl.innerHTML =
            '<div style="color:#AA0000">No rempl publishers inited</div>';
    }
}

function startIdentify(num, callback) {
    overlayEl.firstChild.innerHTML = num;
    pickPublisherCallback = callback;
    updatePublisherList();
    documentStyleOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.appendChild(overlayEl);
}

function stopIdentify() {
    pickPublisherCallback = null;

    if (overlayEl.parentNode !== document.body) {
        return;
    }

    document.body.style.overflow = documentStyleOverflow;
    document.body.removeChild(overlayEl);
}

module.exports = {
    start: startIdentify,
    stop: stopIdentify,
    updatePublisherList: function (value) {
        publishers = value;
        updatePublisherList();
    },
};
