export {
    GetRemoteUISettings,
    GetRemoteUIHandler,
    GetRemoteUIInternalResult,
} from '../transport/types.js';

export type Options = { ws?: string };
export type WsSettings = {
    explicit: string | undefined;
    implicit: string;
};
