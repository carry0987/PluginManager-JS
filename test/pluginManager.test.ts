import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PluginManager } from '../src/index';

describe('PluginManager', () => {
    let tempDir: string;
    let sourceDir: string;
    let targetDir: string;
    let nodeModulesDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-manager-'));
        sourceDir = path.join(tempDir, 'source');
        targetDir = path.join(tempDir, 'target');
        nodeModulesDir = path.join(tempDir, 'node_modules');

        fs.mkdirSync(sourceDir, { recursive: true });
        fs.mkdirSync(targetDir, { recursive: true });
        fs.mkdirSync(nodeModulesDir, { recursive: true });
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should create and empty a directory', () => {
        fs.mkdirSync(path.join(targetDir, 'nested'), { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'nested', 'file.txt'), 'content');

        PluginManager.emptyDir(targetDir);

        expect(fs.existsSync(targetDir)).toBe(true);
        expect(fs.readdirSync(targetDir)).toEqual([]);
    });

    it('should copy package files from multiple rules', () => {
        fs.mkdirSync(path.join(nodeModulesDir, 'example-pkg', 'dist'), { recursive: true });
        fs.mkdirSync(path.join(nodeModulesDir, 'example-pkg', 'docs'), { recursive: true });
        fs.mkdirSync(path.join(nodeModulesDir, 'example-pkg', 'assets', 'icon'), { recursive: true });
        fs.mkdirSync(path.join(nodeModulesDir, '@scope', 'example-pkg', 'dist'), { recursive: true });

        fs.writeFileSync(path.join(nodeModulesDir, 'example-pkg', 'dist', 'example.bundle.min.js'), 'bundle');
        fs.writeFileSync(path.join(nodeModulesDir, 'example-pkg', 'dist', 'example.min.css'), 'css');
        fs.writeFileSync(path.join(nodeModulesDir, 'example-pkg', 'dist', 'ignore.js'), 'ignore');
        fs.writeFileSync(path.join(nodeModulesDir, 'example-pkg', 'docs', 'example.md'), 'docs');
        fs.writeFileSync(path.join(nodeModulesDir, 'example-pkg', 'assets', 'icon', 'logo.svg'), 'svg');
        fs.writeFileSync(path.join(nodeModulesDir, '@scope', 'example-pkg', 'dist', 'scoped.js'), 'scoped');

        PluginManager.copyPackages(nodeModulesDir, targetDir, [
            {
                name: 'example-pkg',
                from: 'dist',
                include: ['**/example.bundle.min.js', '**/example.min.css']
            },
            {
                name: 'example-pkg',
                from: 'docs',
                include: ['**/*.md']
            },
            {
                name: 'example-pkg',
                from: 'assets/icon',
                to: 'icons',
                include: ['**/*.svg']
            },
            {
                name: '@scope/example-pkg',
                from: 'dist',
                include: ['**/*.js']
            },
            {
                name: 'missing-pkg',
                optional: true
            }
        ]);

        expect(fs.existsSync(path.join(targetDir, 'example-pkg', 'example.bundle.min.js'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'example-pkg', 'example.min.css'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'example-pkg', 'example.md'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'example-pkg', 'icons', 'logo.svg'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'example-pkg', 'ignore.js'))).toBe(false);
        expect(fs.existsSync(path.join(targetDir, '@scope', 'example-pkg', 'scoped.js'))).toBe(true);
    });

    it('should throw when package rules would overwrite the same destination', () => {
        fs.mkdirSync(path.join(nodeModulesDir, 'conflict-pkg', 'dist'), { recursive: true });
        fs.mkdirSync(path.join(nodeModulesDir, 'conflict-pkg', 'docs'), { recursive: true });

        fs.writeFileSync(path.join(nodeModulesDir, 'conflict-pkg', 'dist', 'same.txt'), 'dist');
        fs.writeFileSync(path.join(nodeModulesDir, 'conflict-pkg', 'docs', 'same.txt'), 'docs');

        expect(() => {
            PluginManager.copyPackages(nodeModulesDir, targetDir, [
                {
                    name: 'conflict-pkg',
                    from: 'dist',
                    include: ['**/*.txt']
                },
                {
                    name: 'conflict-pkg',
                    from: 'docs',
                    include: ['**/*.txt']
                }
            ]);
        }).toThrow(/Copy conflict/);
    });

    it('should copy files with include and exclude filters', () => {
        fs.mkdirSync(path.join(sourceDir, 'nested'), { recursive: true });
        fs.writeFileSync(path.join(sourceDir, 'keep.js'), 'keep');
        fs.writeFileSync(path.join(sourceDir, 'remove.css'), 'remove');
        fs.writeFileSync(path.join(sourceDir, 'nested', 'keep.txt'), 'nested');

        PluginManager.copyFiles(sourceDir, targetDir, {
            include: ['**/*'],
            exclude: ['**/*.css']
        });

        expect(fs.existsSync(path.join(targetDir, 'keep.js'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'nested', 'keep.txt'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'remove.css'))).toBe(false);
    });

    it('should clear unnecessary files using relative micromatch patterns', () => {
        fs.mkdirSync(path.join(targetDir, 'nested'), { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'nested', 'keep.js'), 'keep');
        fs.writeFileSync(path.join(targetDir, 'nested', 'drop.css'), 'drop');

        PluginManager.clearUnnecessaryFiles(targetDir, ['**/*.js']);

        expect(fs.existsSync(path.join(targetDir, 'nested', 'keep.js'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'nested', 'drop.css'))).toBe(false);
    });

    it('should clear empty directories recursively', () => {
        fs.mkdirSync(path.join(sourceDir, 'dir1', 'dir2'), { recursive: true });

        const result = PluginManager.clearEmptyDirs(sourceDir);

        expect(result).toBe(true);
        expect(fs.existsSync(path.join(sourceDir, 'dir1'))).toBe(false);
    });

    it('should remove directories', () => {
        fs.mkdirSync(path.join(targetDir, 'dir1'), { recursive: true });
        PluginManager.removeDirs([path.join(targetDir, 'dir1')]);

        expect(fs.existsSync(path.join(targetDir, 'dir1'))).toBe(false);
    });
});
