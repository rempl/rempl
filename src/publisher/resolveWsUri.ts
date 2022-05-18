export function resolveWsUri(uri?: string | boolean) {
    let resolvedUri: string | boolean = false;

    switch (uri) {
        case 'implicit':
        case 'auto':
        case true:
            resolvedUri = 'implicit';
            break;

        case 'explicit':
        case undefined:
            resolvedUri = 'explicit';
            break;

        case false:
            // decline connection, do nothing
            return;

        default:
            if (typeof uri === 'string') {
                resolvedUri = uri;
            } else {
                console.warn(
                    '[rempl] Bad value of `options.ws` option for `createPublisher(.., .., options)`'
                );
                return;
            }
    }

    return resolvedUri;
}
