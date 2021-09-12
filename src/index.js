module.exports = {
    version: require("../package.json").version,
    source: require("./source.js"),

    createEnv: require("./env/index.js").createEnv,
    getEnv: require("./env/index.js").getEnv,

    createSandbox: require("./sandbox/index.js"),
    getHost: require("./host/in-page/index.js"),

    createPublisher: require("./publisher/index.js"),
    getSubscriber: require("./subscriber/index.js"),

    scriptFromFile: require("./sdk/scriptFromFile.js"),
};
