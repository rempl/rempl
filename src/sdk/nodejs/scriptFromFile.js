var fs = require('fs');

module.exports = function(filename) {
    var cache = null;

    // TODO: take in account settings.accept setting
    return function(settings, callback) {
        if (settings.dev || cache === null) {
            fs.readFile(filename, 'utf-8', function(err, content) {
                if (err) {
                    return callback(String(err));
                }

                cache = content;
                callback(null, 'script', content);
            });
        } else {
            callback(null, 'script', cache);
        }
    };
};
