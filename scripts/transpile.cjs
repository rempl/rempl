const fs = require('fs');
const path = require('path');
const sucrase = require('sucrase');
const { rollup, watch } = require('rollup');

const external = ['fs', 'path', 'assert', 'module', 'socket.io-client/dist/socket.io.slim.js'];

function removeCreateRequire(code) {
    return code
        .replace(/import { createRequire } from 'module';\n?/, '')
        .replace(/const require = createRequire\(.+?\);\n?/, '');
}

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

async function transpile(
    outputDir,
    { watch: watchMode = false, ts = false, format },
    ...entryPoints
) {
    const startTime = Date.now();
    const outputExt = format === 'esm' ? '.js' : '.cjs';

    const inputOptions = {
        external,
        input: entryPoints,
        plugins: [
            resolvePath(ts, outputExt),
            ts && transpileTypeScript(),
            replaceContent({
                'src/version.js': removeCreateRequire,
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
        console.log();
        console.log(
            `Convert ${
                ts ? 'TypeScript to JavaScript (ESM)' : 'ESM to CommonJS'
            } (output: ${outputDir})`
        );

        const bundle = await rollup(inputOptions);
        await bundle.write(outputOptions);
        await bundle.close();

        console.log(`Done in ${Date.now() - startTime}ms`);
    } else {
        const watcher = watch({
            ...inputOptions,
            output: outputOptions,
        });

        watcher.on('event', ({ code, duration }) => {
            if (code === 'BUNDLE_END') {
                console.log(
                    `Convert ${
                        ts ? 'TypeScript to JavaScript (ESM)' : 'ESM to CommonJS'
                    } into "${outputDir}" done in ${duration}ms`
                );
            }
        });
    }
}

async function transpileAll(watch = false) {
    await transpile('./esm', { watch, ts: true, format: 'esm' }, 'src/index.ts', 'src/browser.ts');
    await transpile('./esm-test', { watch, ts: true, format: 'esm' }, ...readDir('test'));
    await transpile('./cjs', { watch, format: 'cjs' }, 'esm/index.js', 'esm/browser.js');
    await transpile('./cjs-test', { watch, format: 'cjs' }, ...readDir('esm-test'));
}

module.exports = transpileAll;

if (require.main === module) {
    const watchMode = process.argv.includes('--watch');

    transpileAll(watchMode);
}
