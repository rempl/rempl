/* eslint-env browser */

module.exports = function(filename) {
    // TODO: implement cache and use settings
    return function(settings, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onerror = function() {
            callback('An error occurred while transferring the file – `' + filename + '`');
        };
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(null, 'script', xhr.responseText);
                } else {
                    callback('There was a problem with the file request – `' + filename + '` (status: ' + xhr.status + ')');
                }
            }
        };
        xhr.open('GET', filename, true);
        xhr.send(null);
    };
};
