const esbuild = require('esbuild');

module.exports = {
    buildMain,
};

async function buildMain(config, configCSS) {
    const inpageCss = await esbuild.build({
        entryPoints: ['src/host/in-page/style.css'],
        bundle: true,
        loader: {
            '.png': 'dataurl',
            '.svg': 'dataurl',
        },
        sourcemap: true,
        ...configCSS,
        write: false,
    });

    const result = await esbuild.build({
        entryPoints: ['src/index.js'],
        bundle: true,
        sourcemap: true,
        format: 'esm',
        write: false,
        ...config,
        define: {
            ...config.define,
            __INPAGE_CSS__: JSON.stringify(inpageCss.outputFiles[0].text),
        },
    });

    if (result.outputFiles && result.outputFiles.length) {
        return result.outputFiles[0].text;
    }
}

if (require.main === module) {
    (async () => {
        buildMain(
            {
                write: true,
                outfile: 'dist/rempl-new.js',
                format: 'esm',
                // minify: true,
                // sourcemap: false,
                define: {
                    __DEV__: false,
                },
            },
            {
                // minify: true,
                // sourcemap: false,
            }
        );
    })();
}
