import { RollupOptions } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from 'rollup-plugin-dts';
import { createRequire } from 'module';

const pkg = createRequire(import.meta.url)('./package.json');
const sourceFile = 'src/index.ts';

// ESM build configuration
const esmConfig: RollupOptions = {
    input: sourceFile,
    output: [
        {
            file: pkg.module,
            format: 'es',
            sourcemap: false
        }
    ],
    plugins: [
        typescript(),
        nodeResolve(),
        replace({
            preventAssignment: true,
            __version__: pkg.version
        }),
        commonjs()
    ]
};

// CommonJS build configuration
const cjsConfig: RollupOptions = {
    input: sourceFile,
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            sourcemap: false
        }
    ],
    plugins: [
        typescript(),
        nodeResolve(),
        replace({
            preventAssignment: true,
            __version__: pkg.version
        }),
        commonjs()
    ]
};

// TypeScript type definition configuration
const dtsConfig: RollupOptions = {
    input: sourceFile,
    output: {
        file: pkg.types,
        format: 'es'
    },
    plugins: [
        dts()
    ]
};

export default [esmConfig, cjsConfig, dtsConfig];
