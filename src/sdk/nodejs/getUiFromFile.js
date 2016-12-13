var fs = require('fs');

module.exports = function(filename) {
    // TODO: implement cache and use settings
    return function(settings, callback) {
        fs.readFile(filename, 'utf-8', function(err, content) {
            if (err) {
                return callback(String(err));
            }

            callback(null, 'script', content);
        });
    };
};
