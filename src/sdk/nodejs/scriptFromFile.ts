import { GetRemoteUIFn } from "../../transport/event";

export default function (filename: string): GetRemoteUIFn {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    let cache: string | null = null;

    // TODO: take in account settings.accept setting
    return function (settings, callback) {
        if (settings.dev || cache === null) {
            fs.readFile(
                filename,
                "utf-8",
                function (err: Error | null, content?: string) {
                    if (err) {
                        return callback(String(err));
                    }

                    cache = content ?? null;
                    callback(null, "script", content);
                }
            );
        } else {
            callback(null, "script", cache);
        }
    };
}
