export type RequestClientHandler = (
    error: string | null,
    type: string,
    response: Record<string, string> | string | null
) => void;
export type GetRemoteUIHandler = (
    settings: unknown,
    callback: (error: string | null, type: 'url' | 'script', content: string) => void
) => void;
export type Options = { ws?: string };
export type WsSettings = {
    explicit: string | undefined;
    implicit: string;
};
