const fs = require('fs');
const esbuild = require('esbuild');
const { buildCssModule } = require('./utils.cjs');

module.exports = {
    buildMain,
    buildBundle,
};

async function buildMain(config, configCSS) {
    const result = await esbuild.build({
        entryPoints: ['src/browser.ts'],
        bundle: true,
        // sourcemap: true,
        format: 'iife',
        write: false,
        ...config,
        plugins: [
            {
                name: 'version',
                setup({ onLoad }) {
                    onLoad({ filter: /\/version\.ts$/ }, () => ({
                        contents: 'export const version = "foo";',
                    }));
                    onLoad({ filter: /\/style\.ts$/ }, ({ path }) =>
                        buildCssModule(path, { sourcemap: true, minify: false, ...configCSS }).then(
                            (contents) => ({ contents })
                        )
                    );
                },
            },
        ],
        define: {
            ...config.define,
        },
    });

    if (result.outputFiles && result.outputFiles.length) {
        return result.outputFiles[0].text;
    }
}

async function buildBundle(options) {
    const {
        outfile = './dist/rempl.js',
        outfileEsm = typeof outfile === 'string' ? outfile.replace(/\.[^.]+$/, '.esm$&') : false,
    } = options || {};

    const startTime = Date.now();
    let bundle = await buildMain(
        {
            legalComments: 'none',
            // write: true,
            // outfile: 'dist/rempl-new.js',
            format: 'esm',
            minify: true,
            // sourcemap: false,
            define: {
                __DEV__: false,
            },
        },
        {
            legalComments: 'none',
            logLevel: 'info',
            minify: true,
            sourcemap: false,
        }
    );

    // capture exports
    let exportDef = '';
    bundle = bundle.replace(/export\s*\{((?:.|\s)+)\}/, (_, e) => {
        exportDef = e.trim();
        return '';
    });
    const names = exportDef.split(/\s*,\s*/).map((entry) => {
        const [name, alias = name] = entry.split(/\s+as\s+/);

        return { name, alias };
    });

    const [bundleEsm, bundleIife] = (
        await Promise.all(
            [
                // ESM
                `const {${names.map(
                    (n) => n.alias
                )}} = (function rempl() {\n${bundle}\nreturn {${names
                    .map((n) => (n.alias === n.name ? n.name : `${n.alias}: ${n.name}`))
                    .join(',\n')}}\n})();\n\nexport{${names.map((n) => n.alias)}}`,

                // IIFE
                `window.rempl = (function rempl() {\n${bundle}\nreturn {${names
                    .map((n) => (n.alias === n.name ? n.name : `${n.alias}: ${n.name}`))
                    .join(',\n')}}\n})();`,
            ].map((contents) =>
                esbuild.build({
                    stdin: {
                        contents,
                    },
                    format: 'esm',
                    logLevel: 'info',
                    minify: true,
                    write: false,
                })
            )
        )
    ).map((bundle) => bundle.outputFiles[0].text);

    if (outfile) {
        fs.writeFileSync(outfile, bundleIife);
    }

    if (outfileEsm) {
        fs.writeFileSync(outfileEsm, bundleEsm);
    }

    console.log(`Bundle ${outfile || '<output>'} built in ${Date.now() - startTime}`);

    if (!outfile) {
        return {
            iife: bundleIife,
            esm: bundleEsm,
        };
    }
}

if (require.main === module) {
    buildBundle();
}
