// please, make appropriate changes in scripts/process-rempl-bundle.js when update this assignment
module.exports = require("fs").readFileSync(
    __dirname + "/../dist/rempl.js",
    "utf8"
);
