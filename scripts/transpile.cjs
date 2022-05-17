const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sucrase = require('sucrase');
const { rollup, watch } = require('rollup');
const chalk = require('chalk');
const { buildBundle } = require('./build.cjs');
const { version } = require('../package.json');
const { buildCssModule } = require('./utils.cjs');

const external = [
    'fs',
    'path',
    'url',
    'assert',
    'module',
    'socket.io-client',
    'socket.io-client/dist/socket.io.slim.js',
];

function replaceContent(map) {
    return {
        name: 'file-content-replacement',
        transform(code, id) {
            const key = path.relative('', id);

            if (map.hasOwnProperty(key)) {
                return map[key](code, id);
            }
        },
    };
}

function resolvePath(ts = false, ext) {
    return {
        name: 'transpile-ts',
        resolveId(source, parent) {
            if (parent && !/\/(src|lib)\//.test(parent) && /\/(src|lib)\//.test(source)) {
                return {
                    id: source
                        // .replace(/\/lib\//, '/cjs/')
                        .replace(/\/src\//, '/lib/')
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
                    filePath: id,
                    transforms: ['typescript'],
                    sourceMapOptions: {
                        compiledFilename: id,
                    },
                });

                return {
                    code: output,
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
                'src/utils/version.ts': () => `export const version = "${version}";`,
                'src/host/in-page/style.ts': (code, id) => buildCssModule(id),
                'src/publisher/browser/identify/style.ts': (code, id) => buildCssModule(id),
            }),
        ],
    };
    const outputOptions = {
        dir: outputDir,
        entryFileNames: `[name]${outputExt}`,
        sourcemap: ts,
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

async function generateTypes() {
    const doneMessage = (duration) => `Generate .d.ts files into "lib" done in ${duration}ms`;

    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        exec('npm run ts-emit-types', (error) => {
            if (error) {
                console.error(chalk.bgRed.white('ERROR!'), chalk.red(error.message));
                reject(error);
            } else {
                console.log(doneMessage(Date.now() - startTime));
                resolve();
            }
        });
    });
}

async function transpileAll(options) {
    const { watch = false, types = false, bundle = false } = options || {};

    await transpile({
        entryPoints: ['src/node.ts', 'src/browser.ts'],
        outputDir: './lib',
        format: 'esm',
        watch,
        ts: true,
        onSuccess: async () => {
            if (types) {
                generateTypes();
            }

            if (bundle) {
                buildBundle();
            }

            await transpile({
                entryPoints: ['lib/node.js', 'lib/browser.js'],
                outputDir: './lib',
                format: 'cjs',
            });
        },
    });
    await transpile({
        entryPoints: readDir('test'),
        outputDir: './lib-test',
        format: 'esm',
        watch,
        ts: true,
        onSuccess: () =>
            transpile({
                entryPoints: readDir('lib-test'),
                outputDir: './lib-test',
                format: 'cjs',
            }),
    });
}

module.exports = transpileAll;

if (require.main === module) {
    transpileAll({
        watch: process.argv.includes('--watch'),
        types: process.argv.includes('--types'),
        bundle: process.argv.includes('--bundle'),
    });
}
