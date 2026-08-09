import { createRequire } from 'node:module';
import { defineConfig, type RolldownOptions } from 'rolldown';
import { replacePlugin } from 'rolldown/plugins';
import { dts } from 'rolldown-plugin-dts';

const pkg = createRequire(import.meta.url)('./package.json');
const sourceFile = 'src/index.ts';

const basePlugins = [
    replacePlugin(
        {
            __version__: pkg.version
        },
        {
            preventAssignment: true
        }
    )
];

const esmConfig: RolldownOptions = {
    input: sourceFile,
    platform: 'node',
    tsconfig: './tsconfig.json',
    output: {
        codeSplitting: false,
        file: pkg.module,
        format: 'es',
        sourcemap: false
    },
    plugins: basePlugins
};

const cjsConfig: RolldownOptions = {
    input: sourceFile,
    platform: 'node',
    tsconfig: './tsconfig.json',
    output: {
        codeSplitting: false,
        file: pkg.main,
        format: 'cjs',
        sourcemap: false
    },
    plugins: basePlugins
};

const dtsConfig: RolldownOptions = {
    input: sourceFile,
    tsconfig: './tsconfig.json',
    output: {
        dir: 'dist',
        format: 'es'
    },
    plugins: [dts({ emitDtsOnly: true })]
};

export default defineConfig([esmConfig, cjsConfig, dtsConfig]);
