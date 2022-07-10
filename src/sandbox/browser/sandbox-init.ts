type SandboxInitEvent = MessageEvent<{
    action: 'rempl-sandbox-init-scripts';
    scripts: Record<string, string>;
}>;

export function initSandboxScript() {
    addEventListener('message', function handleMessage(event: SandboxInitEvent) {
        const { action, scripts } = event.data || {};

        if (action === 'rempl-sandbox-init-scripts' && scripts) {
            // handle message only once
            removeEventListener('message', handleMessage);

            // evaluate scripts
            for (const [sourceURL, source] of Object.entries(scripts)) {
                // indirect eval, see detail: https://esbuild.github.io/content-types/#direct-eval
                Function(`${source}\n//# sourceURL=${sourceURL}`)();
            }
        }
    });
}
