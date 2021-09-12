var isNode = require("../utils/index.js").isNode;
var createEnv = require("./publisher.js");
var getEnv = require("./subscriber.js");

module.exports = !isNode
    ? {
          createEnv: createEnv,
          getEnv: getEnv,
      }
    : {
          createEnv: function () {
              throw new Error(
                  "[rempl] createEnv() doesn't supported for node.js"
              );
          },
          getEnv: function () {
              throw new Error("[rempl] getEnv() doesn't supported for node.js");
          },
      };
