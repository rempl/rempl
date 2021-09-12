var remplSource = require("../source.js");

module.exports = function (publisher, getRemoteUI) {
    publisher.getRemoteUI = function (settings, callback) {
        getRemoteUI(settings, function (error, type, content) {
            if (!error && type === "script") {
                // send with user script rempl source too
                content = {
                    "rempl.js": remplSource,
                    "publisher-ui.js": content,
                };
            }

            callback(error, type, content);
        });
    };
};
