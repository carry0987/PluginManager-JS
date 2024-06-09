import { Options as MicromatchOptions } from 'micromatch';
declare class PluginManager {
    static cleanDir(sourceDir: string, targetDir?: string): void;
    static copyDistFolders(sourceDir: string, targetDir: string): void;
    static moveFiles(sourceDir: string, targetDir: string, pattern?: string, matchOption?: MicromatchOptions): void;
    static clearUnnecessaryFiles(targetDir: string, patterns: string[]): void;
    static clearEmptyDirs(directory: string): boolean;
    static removeDirs(dirs: string[]): void;
    /**
     * Recursively remove directories using fs.
     * @param dirPath
     */
    private static removeDir;
    /**
     * Find all dist directories in the specified directory.
     * @param dir The directory to search.
     * @param getRealPath Whether to get the real path of the directory.
     */
    private static findDistDirs;
    /**
     * Find all files, including symbolic links, in the target directory.
     * @param targetDir The target directory.
     * @returns An array of file paths.
     */
    private static findDestDirs;
    /**
     * Recursively copy files from source directory to target directory.
     * This function is moved outside of the class as a static method.
     * @param src Source directory.
     * @param dest Destination directory.
     */
    private static copyRecursiveSync;
    private static getAllFiles;
}
export { PluginManager };
