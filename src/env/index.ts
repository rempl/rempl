import { isNode } from "../utils";

import createEnv from "./publisher";

import getEnv from "./subscriber";

export default !isNode
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
