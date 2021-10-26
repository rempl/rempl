import { isNode } from '../utils';
import createEnv_ from './publisher';
import getEnv_ from './subscriber';

export const createEnv = !isNode
    ? createEnv_
    : function () {
          throw new Error("[rempl] createEnv() doesn't supported for node.js");
      };
export const getEnv = !isNode
    ? getEnv_
    : function () {
          throw new Error("[rempl] getEnv() doesn't supported for node.js");
      };
