import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from 'rollup-plugin-dts';
import { createRequire } from 'module';
const pkg = createRequire(import.meta.url)('./package.json');

const isDts = process.env.BUILD === 'dts';
const sourceFile = 'src/index.ts';

// ESM build configuration
const esmConfig = {
    input: sourceFile,
    output: [
        {
            file: pkg.module,
            format: 'es',
            sourcemap: false
        }
    ],
    external: {
        'fs': 'fs',
        'path': 'path',
        'micromatch': 'micromatch'
    },
    plugins: [
        resolve(),
        typescript(),
        replace({
            preventAssignment: true,
            __version__: pkg.version
        }),
        commonjs()
    ]
};

// TypeScript type definition configuration
const dtsConfig = {
    input: sourceFile,
    output: {
        file: pkg.types,
        format: 'es'
    },
    plugins: [
        dts()
    ]
};

export default isDts ? dtsConfig : esmConfig;
