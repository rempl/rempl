const fs = require('fs');
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
        entryPoints: ['src/browser.ts'],
        bundle: true,
        // sourcemap: true,
        format: 'iife',
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
        let bundle = await buildMain(
            {
                // write: true,
                // outfile: 'dist/rempl-new.js',
                format: 'esm',
                // minify: true,
                // sourcemap: false,
                define: {
                    __DEV__: false,
                },
            },
            {
                minify: true,
                sourcemap: false,
            }
        );

        let exportDef = '';
        bundle = bundle.replace(/export\s*\{((?:.|\s)+)\}/, (_, e) => {
            exportDef = e.trim();
            return '';
        });
        const names = exportDef.split(/\s*,\s*/).map((entry) => {
            const [name, alias = name] = entry.split(/\s+as\s+/);

            return { name, alias };
        });

        bundle = `const {${names.map(
            (n) => n.alias
        )}} = (function rempl() {\n${bundle}\nreturn {${names
            .map((n) => `${n.alias}: ${n.name}`)
            .join(',\n')}}\n})();\n\nexport default {${names.map((n) => n.alias)}}`;

        bundle = esbuild.buildSync({
            stdin: {
                contents: bundle,
            },
            format: 'esm',
            minify: true,
            write: false,
        }).outputFiles[0].text;
        // console.log(Object.keys(bundle));

        fs.writeFileSync('./dist/rempl-new.js', bundle);
    })();
}
