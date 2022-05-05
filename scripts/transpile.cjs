const fs = require('fs');
const path = require('path');
const sucrase = require('sucrase');
const { rollup, watch } = require('rollup');
const chalk = require('chalk');

const external = [
    'fs',
    'path',
    'url',
    'assert',
    'module',
    'socket.io-client/dist/socket.io.slim.js',
];

function removeCreateRequire(code) {
    return code
        .replace("import { fileURLToPath } from 'url';\n", '')
        .replace('path.dirname(fileURLToPath(import.meta.url))', '__dirname')
        .replace(/import { createRequire } from 'module';\n?/, '')
        .replace(/const require = createRequire\(.+?\);\n?/, '');
}

function replaceContent(map) {
    return {
        name: 'file-content-replacement',
        transform(code, id) {
            const key = path.relative('', id);

            if (map.hasOwnProperty(key)) {
                console.log(key);
                console.log('replace');
                return map[key](code, id);
            }
        },
    };
}

function resolvePath(ts = false, ext) {
    return {
        name: 'transpile-ts',
        resolveId(source, parent) {
            if (parent && !/\/(src|esm)\//.test(parent) && /\/(src|esm)\//.test(source)) {
                return {
                    id: source
                        .replace(/\/esm\//, '/cjs/')
                        .replace(/\/src\//, '/esm/')
                        .replace(/\.js$/, ext),
                    external: true,
                };
            }
            if (ts && parent && source.startsWith('.')) {
                return path.resolve(path.dirname(parent), source.replace(/\.js$/, '.ts'));
            }
            return null;
        },
    };
}

function transpileTypeScript() {
    return {
        name: 'transpile-ts',
        transform(input, id) {
            if (id.endsWith('.ts')) {
                const { code: output, sourceMap } = sucrase.transform(input, {
                    transforms: ['typescript'],
                });

                return {
                    code: output.replace(/\n{3,}/g, '\n\n'),
                    map: sourceMap,
                };
            }
        },
    };
}

function readDir(dir) {
    return fs
        .readdirSync(dir)
        .filter((fn) => fn.endsWith('.js') || fn.endsWith('.ts'))
        .map((fn) => `${dir}/${fn}`);
}

async function transpile({
    entryPoints,
    outputDir,
    format,
    watch: watchMode = false,
    ts = false,
    onSuccess,
}) {
    const outputExt = format === 'esm' ? '.js' : '.cjs';
    const doneMessage = (duration) =>
        `${
            ts ? 'Compile TypeScript to JavaScript (ESM)' : 'Convert ESM to CommonJS'
        } into "${outputDir}" done in ${duration}ms`;

    const inputOptions = {
        external,
        input: entryPoints,
        plugins: [
            resolvePath(ts, outputExt),
            transpileTypeScript(),
            replaceContent({
                'esm/utils/version.js': removeCreateRequire,
                'esm/utils/source.js': removeCreateRequire,
            }),
        ],
    };
    const outputOptions = {
        dir: outputDir,
        entryFileNames: `[name]${outputExt}`,
        format,
        exports: 'auto',
        preserveModules: true,
        interop: false,
        esModule: format === 'esm',
        generatedCode: {
            constBindings: true,
        },
    };

    if (!watchMode) {
        const startTime = Date.now();
        const bundle = await rollup(inputOptions);
        await bundle.write(outputOptions);
        await bundle.close();

        console.log(doneMessage(Date.now() - startTime));

        if (typeof onSuccess === 'function') {
            await onSuccess();
        }
    } else {
        const watcher = watch({
            ...inputOptions,
            output: outputOptions,
        });

        watcher.on('event', ({ code, duration, error }) => {
            if (code === 'BUNDLE_END') {
                console.log(doneMessage(duration));

                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            } else if (code === 'ERROR') {
                console.error(chalk.bgRed.white('ERROR!'), chalk.red(error.message));
            }
        });
    }
}

async function transpileAll(watch = false) {
    await transpile({
        entryPoints: ['src/node.ts', 'src/browser.ts'],
        outputDir: './esm',
        format: 'esm',
        watch,
        ts: true,
        onSuccess: () =>
            transpile({
                entryPoints: ['esm/node.js', 'esm/browser.js'],
                outputDir: './cjs',
                format: 'cjs',
            }),
    });
    await transpile({
        entryPoints: readDir('test'),
        outputDir: './esm-test',
        format: 'esm',
        watch,
        ts: true,
        onSuccess: () =>
            transpile({
                entryPoints: readDir('esm-test'),
                outputDir: './cjs-test',
                format: 'cjs',
            }),
    });
}

module.exports = transpileAll;

if (require.main === module) {
    const watchMode = process.argv.includes('--watch');

    transpileAll(watchMode);
}
