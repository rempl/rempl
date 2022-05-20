export type GetRemoteUISettings = {
    dev?: boolean;
    [key: string]: unknown;
};

export type GetRemoteUIResult =
    | {
          type: 'script';
          value: string;
      }
    | { type: 'url'; value: string };
export type GetRemoteUIHandler = (
    settings: GetRemoteUISettings
) => GetRemoteUIResult | Promise<GetRemoteUIResult>;

export type GetRemoteUIInternalResult =
    | { error: string }
    | { type: 'script'; value: Record<string, string> }
    | { type: 'url'; value: string };
export type GetRemoteUIInternalHandler = (
    settings: GetRemoteUISettings
) => Promise<GetRemoteUIInternalResult>;
