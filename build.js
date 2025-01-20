const esbuild = require('esbuild');

const watchMode = process.argv.includes('--watch');

const buildOptions = {
    entryPoints: ['main.ts'],
    bundle: true,
    external: ['obsidian'],
    format: 'cjs',
    target: 'es2018',
    logLevel: 'info',
    sourcemap: 'inline',
    treeShaking: true,
    outfile: 'main.js',
};

async function build() {
    try {
        if (watchMode) {
            const context = await esbuild.context(buildOptions);
            await context.watch();
            console.log('Watching for changes...');
        } else {
            await esbuild.build(buildOptions);
            console.log('Build complete');
        }
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

build();