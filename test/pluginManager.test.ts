import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PluginManager } from '../src/index';

describe('PluginManager', () => {
    const mockSourceDir = path.resolve(__dirname, 'mock/source');
    const mockTargetDir = path.resolve(__dirname, 'mock/target');

    beforeEach(() => {
        // Mock fs functions
        vi.mock('fs', async () => {
            const actual = await vi.importActual<typeof fs>('fs');
            return {
                ...actual,
                existsSync: vi.fn(() => true),
                readdirSync: vi.fn(() => []),
                realpathSync: vi.fn((p) => p),
                lstatSync: vi.fn(() => ({ isDirectory: () => false, isFile: () => true })),
                mkdirSync: vi.fn(),
                copyFileSync: vi.fn(),
                unlinkSync: vi.fn(),
                rmSync: vi.fn(),
                readdir: vi.fn()
            };
        });

        // Spy on calls
        vi.spyOn(fs, 'existsSync');
        vi.spyOn(fs, 'readdirSync');
        vi.spyOn(fs, 'realpathSync');
        vi.spyOn(fs, 'lstatSync');
        vi.spyOn(fs, 'mkdirSync');
        vi.spyOn(fs, 'copyFileSync');
        vi.spyOn(fs, 'unlinkSync');
        vi.spyOn(fs, 'rmSync');

        // Create necessary directories and files
        if (!fs.existsSync(mockSourceDir)) {
            fs.mkdirSync(mockSourceDir + '/dir1', { recursive: true });
        }
        if (!fs.existsSync(mockTargetDir)) {
            fs.mkdirSync(mockTargetDir, { recursive: true });
        }
    });

    afterEach(() => {
        // Clean up directories
        if (fs.existsSync(mockSourceDir)) {
            fs.rmSync(mockSourceDir, { recursive: true });
        }
        if (fs.existsSync(mockTargetDir)) {
            fs.rmSync(mockTargetDir, { recursive: true });
        }
        // Clear mocks
        vi.clearAllMocks();
    });

    it('should clean directory', () => {
        PluginManager.cleanDir(mockSourceDir, mockTargetDir);
    });

    it('should copy dist folders', () => {
        PluginManager.copyDistFolders(mockSourceDir, mockTargetDir);
    });

    it('should move files', () => {
        PluginManager.moveFiles(mockSourceDir, mockTargetDir);
    });

    it('should clear unnecessary files', () => {
        PluginManager.clearUnnecessaryFiles(mockTargetDir, ['*.js']);
    });

    it('should clear empty directories', () => {
        const result = PluginManager.clearEmptyDirs(mockSourceDir);
        expect(result).toBe(true);
        expect(fs.rmSync).toBeCalled();
    });

    it('should remove directories', () => {
        PluginManager.removeDirs([mockTargetDir]);
        expect(fs.rmSync).toBeCalled();
    });
});
