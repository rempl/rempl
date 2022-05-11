const fs = require('fs');
const esbuild = require('esbuild');

exports.buildCssModule = function (path, configCSS) {
    return esbuild
        .build({
            entryPoints: [path.replace(/\.ts$/, '.css')],
            bundle: true,
            minify: true,
            loader: {
                '.png': 'dataurl',
                '.svg': 'dataurl',
            },
            ...configCSS,
            write: false,
        })
        .then((res) =>
            fs
                .readFileSync(path, 'utf8')
                .replace("'__CSS__'", JSON.stringify(res.outputFiles[0].text))
        );
};
