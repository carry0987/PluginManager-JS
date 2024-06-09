import fs from 'fs';
import path from 'path';
import micromatch, { Options as MicromatchOptions } from 'micromatch';

class PluginManager {
    // Clean directories that match the condition
    static cleanDir(sourceDir: string, targetDir?: string): void {
        const dirs = PluginManager.findDestDirs(sourceDir, targetDir);
        if (dirs.length === 0) {
            return;
        }
        dirs.forEach((dir) => {
            const fullPath = dir;
            PluginManager.removeDir(fullPath);
            console.log(`Removed: ${fullPath}`);
        });
    }

    // Copy the contents of the dist folder
    static copyDistFolders(sourceDir: string, targetDir: string): void {
        const distDirs = PluginManager.findDistDirs(sourceDir);

        distDirs.forEach((dir) => {
            const normalizedDir = dir.split(`${sourceDir}/.pnpm/`).pop()?.split('/node_modules/').pop();
            if (normalizedDir) {
                const fullSourcePath = path.join(sourceDir, normalizedDir);
                let destPath = fullSourcePath.replace(
                    'node_modules',
                    targetDir
                );
                destPath = destPath.replace('/dist', '');
                fs.mkdirSync(destPath, { recursive: true });
                PluginManager.copyRecursiveSync(fullSourcePath, destPath);
                console.log(`Copied: ${fullSourcePath} to ${destPath}`);
            }
        });
    }

    // Move the specified target file or directory
    static moveFiles(
        sourceDir: string,
        targetDir: string,
        pattern: string = '**/*',
        matchOption?: MicromatchOptions
    ): void {
        const files = PluginManager.getAllFiles(sourceDir, pattern, [], matchOption);

        files.forEach((file) => {
            const relativePath = path.relative(sourceDir, file);
            const destination = path.join(targetDir, relativePath);
            const destinationDir = path.dirname(destination);

            fs.mkdirSync(destinationDir, { recursive: true });

            if (fs.lstatSync(file).isFile()) {
                fs.copyFileSync(file, destination);
            }

            console.log(`Moved: ${file} to ${destination}`);
        });
    }

    // Clear unnecessary files
    static clearUnnecessaryFiles(targetDir: string, patterns: string[]): void {
        const files = PluginManager.getAllFiles(targetDir, '**/*');

        files.forEach((file) => {
            const matchesEveryPattern = micromatch.some(file, patterns);
            if (!matchesEveryPattern) {
                fs.unlinkSync(file);
                console.log(`Removed unnecessary file: ${file}`);
            }
        });
    }

    // Clear empty directories using fs
    static clearEmptyDirs(directory: string): boolean {
        const fileStats = fs.readdirSync(directory, { withFileTypes: true });

        // Check subdirectories to see if they are empty
        let isEmpty = true; // Initialize isEmpty flag
        fileStats.forEach((fileStat) => {
            const fullPath = path.join(directory, fileStat.name);

            if (fileStat.isDirectory()) {
                const isDirEmpty = PluginManager.clearEmptyDirs(fullPath);

                // Remove empty directories
                if (isDirEmpty) {
                    PluginManager.removeDir(fullPath);
                    console.log(`Removed empty directory: ${fullPath}`);
                } else {
                    isEmpty = false; // Mark parent as non-empty if any subdirectory is non-empty
                }
            } else {
                isEmpty = false; // Mark parent as non-empty if any file is found
            }
        });

        // Return true if directory is empty
        return isEmpty;
    }

    // Remove the specified directories
    static removeDirs(dirs: string[]): void {
        dirs.forEach((dir) => {
            if (fs.existsSync(dir)) {
                PluginManager.removeDir(dir);
                console.log(`Removed directory: ${dir}`);
            }
        });
    }

    /**
     * Recursively remove directories using fs.
     * @param dirPath 
     */
    private static removeDir(dirPath: string): void {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach((file) => {
                const fullPath = path.join(dirPath, file);
                if (fs.lstatSync(fullPath).isDirectory()) {
                    // Recurse into subdirectory
                    PluginManager.removeDir(fullPath);
                } else {
                    // Delete file
                    fs.unlinkSync(fullPath);
                }
            });
            // Remove now-empty directory
            fs.rmSync(dirPath, { recursive: true });
        }
    }

    /**
     * Find all dist directories in the specified directory.
     * @param dir The directory to search.
     * @param getRealPath Whether to get the real path of the directory.
     */
    private static findDistDirs(
        dir: string,
        getRealPath: boolean = false
    ): string[] {
        const result: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                if (item.name === 'dist') {
                    result.push(
                        !getRealPath ? fullPath : fs.realpathSync(fullPath)
                    );
                } else {
                    result.push(...PluginManager.findDistDirs(fullPath));
                }
            }
        }

        return result;
    }

    /**
     * Find all files, including symbolic links, in the target directory.
     * @param targetDir The target directory.
     * @returns An array of file paths.
     */
    private static findDestDirs(
        sourceDir: string,
        targetDir?: string
    ): string[] {
        const results: string[] = [];
        const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

        entries.forEach((entry) => {
            const fullPath = path.join(targetDir || sourceDir, entry.name);
            results.push(fullPath);
        });

        return results;
    }

    /**
     * Recursively copy files from source directory to target directory.
     * This function is moved outside of the class as a static method.
     * @param src Source directory.
     * @param dest Destination directory.
     */
    private static copyRecursiveSync(src: string, dest: string): void {
        // Check if the source exists
        if (fs.existsSync(src) && fs.lstatSync(src).isDirectory()) {
            // Ensure destination folder exists
            fs.mkdirSync(dest, { recursive: true });

            // Read the contents of the folder
            for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);

                if (entry.isDirectory()) {
                    // Recursively copy directories
                    PluginManager.copyRecursiveSync(srcPath, destPath);
                } else if (entry.isFile() && !entry.name.endsWith('.ts')) {
                    // Copy files
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }
    }

    private static getAllFiles(dir: string, pattern: string, fileList: string[] = [], matchOption?: MicromatchOptions): string[] {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                fileList = PluginManager.getAllFiles(fullPath, pattern, fileList, matchOption);
            } else if (stat.isFile() && micromatch.isMatch(fullPath, pattern, matchOption)) {
                fileList.push(fullPath);
            }
        });

        return fileList;
    }
}

export { PluginManager };
