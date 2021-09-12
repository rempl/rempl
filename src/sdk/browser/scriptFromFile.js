/* eslint-env browser */

function fetchFile(filename, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onerror = function () {
        callback(
            "An error occurred while transferring the file – `" + filename + "`"
        );
    };
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(null, xhr.responseText);
            } else {
                callback(
                    "There was a problem with the file request – `" +
                        filename +
                        "` (status: " +
                        xhr.status +
                        ")"
                );
            }
        }
    };
    xhr.open("GET", filename, true);
    xhr.send(null);
}

module.exports = function (filename) {
    var cache = null;

    // TODO: take in account settings.accept setting
    return function (settings, callback) {
        if (settings.dev || cache === null) {
            fetchFile(filename, function (err, content) {
                if (err) {
                    callback(err);
                }

                cache = content;
                callback(null, "script", content);
            });
        } else {
            callback(null, "script", cache);
        }
    };
};
