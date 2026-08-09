import fs from 'node:fs';
import path from 'node:path';
import micromatch, { type Options as MicromatchOptions } from 'micromatch';
import type { CopyFilesOptions, CopyPackagesOptions, FileEntry, OperationOptions, PackageRule } from '@/types';

class PluginManager {
    /**
     * Ensures that the target directory exists, then removes all contents inside it
     * while keeping the root directory itself.
     *
     * This method is useful for resetting an output directory before copying assets,
     * so stale files from previous runs do not affect the current result.
     *
     * If the directory does not exist, it will be created automatically.
     *
     * @param targetDir The directory to initialize and empty.
     * Example: `template/plugins`.
     * @param options Additional operation options.
     * @param options.verbose When `true`, logs each removed path.
     * @returns Nothing.
     */
    static emptyDir(targetDir: string, options: OperationOptions = {}): void {
        fs.mkdirSync(targetDir, { recursive: true });

        for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
            const fullPath = path.join(targetDir, entry.name);
            PluginManager.removeDir(fullPath);
            PluginManager.log(`Removed: ${fullPath}`, options.verbose);
        }
    }

    /**
     * Copies files from installed packages into the target directory using
     * declarative package rules.
     *
     * Each rule defines which package to read from, which subdirectory inside that
     * package should be used as the source, and which files should be included or
     * excluded using micromatch patterns.
     *
     * The output for every rule is always constrained to:
     * `targetDir/<package-name>/...`
     *
     * If `rule.to` is provided, files are copied into a subdirectory under the
     * package output root:
     * `targetDir/<package-name>/<to>/...`
     *
     * This method prevents path escaping and throws when two rules would produce
     * the same destination file.
     *
     * @param sourceDir The package root directory to resolve packages from.
     * In most cases this will be `node_modules`.
     * @param targetDir The output root directory where package files should be copied.
     * @param rules An array of package copy rules.
     * Each rule supports:
     * - `name`: package name to resolve from `sourceDir`
     * - `from`: source subdirectory inside the package, defaults to `dist`
     * - `to`: target subdirectory under `targetDir/<package-name>`
     * - `include`: micromatch patterns to include
     * - `exclude`: micromatch patterns to exclude
     * - `optional`: whether missing packages or source directories should be skipped
     * @param options Additional operation options.
     * @param options.verbose When `true`, logs copied files and skipped optional rules.
     * @returns Nothing.
     * @throws {Error} Thrown when a package does not exist and the rule is not optional.
     * @throws {Error} Thrown when the source subdirectory does not exist and the rule is not optional.
     * @throws {Error} Thrown when `name`, `from`, or `to` contains an invalid path or attempts to escape the allowed package output scope.
     * @throws {Error} Thrown when multiple rules would overwrite the same destination file.
     */
    static copyPackages(
        sourceDir: string,
        targetDir: string,
        rules: PackageRule[],
        options: CopyPackagesOptions = {}
    ): void {
        const copiedDestinations = new Set<string>();

        for (const rule of rules) {
            const packageName = PluginManager.normalizePackageName(rule.name);
            const packageRoot = PluginManager.resolvePackageRoot(sourceDir, packageName, rule.optional === true);

            if (!packageRoot) {
                PluginManager.log(`Skipped missing package: ${packageName}`, options.verbose);
                continue;
            }

            const fromDir = PluginManager.normalizeSubpath(rule.from ?? 'dist', 'from');
            const sourceRoot = path.join(packageRoot, fromDir);

            if (!fs.existsSync(sourceRoot) || !fs.lstatSync(sourceRoot).isDirectory()) {
                if (rule.optional) {
                    PluginManager.log(`Skipped missing source directory: ${sourceRoot}`, options.verbose);
                    continue;
                }

                throw new Error(`Source directory not found for package "${packageName}": ${sourceRoot}`);
            }

            const targetRoot = PluginManager.resolveTargetRoot(targetDir, packageName, rule.to);
            const files = PluginManager.getMatchingFiles(sourceRoot, rule.include, rule.exclude);

            fs.mkdirSync(targetRoot, { recursive: true });

            for (const file of files) {
                const destination = path.resolve(targetRoot, file.relativePath);
                PluginManager.assertWithinRoot(destination, targetRoot, 'destination');
                PluginManager.assertDestinationAvailable(
                    destination,
                    copiedDestinations,
                    packageName,
                    file.relativePath
                );

                fs.mkdirSync(path.dirname(destination), { recursive: true });
                fs.copyFileSync(file.absolutePath, destination);
                copiedDestinations.add(destination);
                PluginManager.log(`Copied: ${file.absolutePath} to ${destination}`, options.verbose);
            }
        }
    }

    /**
     * Copies files from a regular source directory into a target directory while
     * preserving the relative folder structure.
     *
     * Files are filtered using micromatch-based `include` and `exclude` patterns:
     * - If `include` is not provided, all files are included by default.
     * - Any file matched by `exclude` is skipped.
     *
     * This method is intended for local directories rather than package-based copying.
     *
     * @param sourceDir The source directory to read files from.
     * This directory must exist and must be a directory.
     * @param targetDir The destination directory.
     * It will be created automatically if it does not exist.
     * @param options File copy options.
     * @param options.include Micromatch patterns used to include files.
     * Defaults to matching every file when no include patterns are provided.
     * @param options.exclude Micromatch patterns used to exclude files after inclusion is evaluated.
     * @param options.verbose When `true`, logs each copied file.
     * @returns Nothing.
     * @throws {Error} Thrown when `sourceDir` does not exist or is not a directory.
     */
    static copyFiles(sourceDir: string, targetDir: string, options: CopyFilesOptions = {}): void {
        if (!fs.existsSync(sourceDir) || !fs.lstatSync(sourceDir).isDirectory()) {
            throw new Error(`Source directory not found: ${sourceDir}`);
        }

        const files = PluginManager.getMatchingFiles(sourceDir, options.include, options.exclude);

        fs.mkdirSync(targetDir, { recursive: true });

        for (const file of files) {
            const destination = path.join(targetDir, file.relativePath);
            fs.mkdirSync(path.dirname(destination), { recursive: true });
            fs.copyFileSync(file.absolutePath, destination);
            PluginManager.log(`Copied: ${file.absolutePath} to ${destination}`, options.verbose);
        }
    }

    /**
     * Removes files from the target directory that do not match the provided
     * micromatch patterns.
     *
     * This method uses a retain-style strategy:
     * - Files matching `patterns` are kept.
     * - Files not matching `patterns` are removed.
     *
     * Pattern matching is performed against each file's relative path from `targetDir`,
     * not against its absolute path.
     *
     * This method only removes files. If empty directories should also be removed,
     * call `clearEmptyDirs()` afterward.
     *
     * @param targetDir The directory whose files should be checked and filtered.
     * @param patterns Micromatch patterns that define which files should be kept.
     * Example: keep JavaScript and CSS files.
     * @param options Additional operation options.
     * @param options.verbose When `true`, logs each removed file.
     * @returns Nothing.
     */
    static clearUnnecessaryFiles(targetDir: string, patterns: string[], options: OperationOptions = {}): void {
        const files = PluginManager.getAllFiles(targetDir);

        for (const file of files) {
            if (!PluginManager.matchesAnyPattern(file.relativePath, patterns)) {
                fs.unlinkSync(file.absolutePath);
                PluginManager.log(`Removed unnecessary file: ${file.absolutePath}`, options.verbose);
            }
        }
    }

    /**
     * Recursively removes empty subdirectories under the given directory.
     *
     * The method walks the directory tree from the bottom up:
     * - If a child directory is empty, it is removed.
     * - If a child directory still contains files or non-empty subdirectories, it is kept.
     *
     * If the input directory does not exist, it is treated as empty and the method returns `true`.
     *
     * @param directory The directory to inspect recursively.
     * @param options Additional operation options.
     * @param options.verbose When `true`, logs each removed empty directory.
     * @returns `true` if the directory is empty after processing, otherwise `false`.
     * This return value is mainly used internally by the recursive cleanup flow.
     */
    static clearEmptyDirs(directory: string, options: OperationOptions = {}): boolean {
        if (!fs.existsSync(directory)) {
            return true;
        }

        const fileStats = fs.readdirSync(directory, { withFileTypes: true });
        let isEmpty = true;

        fileStats.forEach((fileStat) => {
            const fullPath = path.join(directory, fileStat.name);

            if (fileStat.isDirectory()) {
                const isDirEmpty = PluginManager.clearEmptyDirs(fullPath, options);
                if (isDirEmpty) {
                    PluginManager.removeDir(fullPath);
                    PluginManager.log(`Removed empty directory: ${fullPath}`, options.verbose);
                } else {
                    isEmpty = false;
                }
            } else {
                isEmpty = false;
            }
        });

        return isEmpty;
    }

    /**
     * Removes the specified directories if they exist.
     *
     * This is intended for explicit cleanup of known directory paths.
     * Non-existent paths are ignored.
     *
     * @param dirs A list of directory paths to remove.
     * @param options Additional operation options.
     * @param options.verbose When `true`, logs each removed directory.
     * @returns Nothing.
     */
    static removeDirs(dirs: string[], options: OperationOptions = {}): void {
        dirs.forEach((dir) => {
            if (fs.existsSync(dir)) {
                PluginManager.removeDir(dir);
                PluginManager.log(`Removed directory: ${dir}`, options.verbose);
            }
        });
    }

    private static removeDir(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        fs.rmSync(dirPath, { recursive: true, force: true });
    }

    private static resolvePackageRoot(sourceDir: string, packageName: string, optional: boolean): string | null {
        const packagePath = path.join(sourceDir, packageName);
        if (!fs.existsSync(packagePath)) {
            if (optional) {
                return null;
            }

            throw new Error(`Package not found: ${packageName}`);
        }

        return fs.realpathSync(packagePath);
    }

    private static resolveTargetRoot(targetDir: string, packageName: string, to?: string): string {
        const packageTargetRoot = path.resolve(targetDir, packageName);
        const toDir = to ? PluginManager.normalizeSubpath(to, 'to') : '';
        const resolvedRoot = path.resolve(packageTargetRoot, toDir);

        PluginManager.assertWithinRoot(resolvedRoot, packageTargetRoot, 'target');

        return resolvedRoot;
    }

    private static normalizePackageName(name: string): string {
        const normalizedName = PluginManager.normalizeSubpath(name, 'name');

        if (!normalizedName) {
            throw new Error('Package name must not be empty.');
        }

        return normalizedName;
    }

    private static getAllFiles(dir: string, rootDir: string = dir, fileList: FileEntry[] = []): FileEntry[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach((entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                fileList = PluginManager.getAllFiles(fullPath, rootDir, fileList);
            } else if (entry.isFile()) {
                fileList.push({
                    absolutePath: fullPath,
                    relativePath: PluginManager.normalizeForMatch(path.relative(rootDir, fullPath))
                });
            }
        });

        return fileList;
    }

    private static getMatchingFiles(
        dir: string,
        include?: string[],
        exclude?: string[],
        matchOption?: MicromatchOptions
    ): FileEntry[] {
        const files = PluginManager.getAllFiles(dir);
        const includePatterns = include && include.length > 0 ? include : ['**/*'];
        const excludePatterns = exclude ?? [];

        return files.filter((file) => {
            const isIncluded = micromatch.isMatch(file.relativePath, includePatterns, matchOption);
            const isExcluded =
                excludePatterns.length > 0 && micromatch.isMatch(file.relativePath, excludePatterns, matchOption);
            return isIncluded && !isExcluded;
        });
    }

    private static matchesAnyPattern(filePath: string, patterns: string[], matchOption?: MicromatchOptions): boolean {
        return micromatch.isMatch(PluginManager.normalizeForMatch(filePath), patterns, matchOption);
    }

    private static normalizeSubpath(value: string, fieldName: string): string {
        if (path.isAbsolute(value)) {
            throw new Error(`${fieldName} must be a relative path.`);
        }

        const normalized = path.normalize(value);
        if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) {
            throw new Error(`${fieldName} must stay within the target package scope.`);
        }

        return normalized === '.' ? '' : normalized;
    }

    private static normalizeForMatch(value: string): string {
        return value.split(path.sep).join('/');
    }

    private static assertWithinRoot(candidatePath: string, rootPath: string, fieldName: string): void {
        const normalizedRoot = path.resolve(rootPath);
        const normalizedCandidate = path.resolve(candidatePath);

        if (normalizedCandidate !== normalizedRoot && !normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`)) {
            throw new Error(`${fieldName} must stay within ${normalizedRoot}.`);
        }
    }

    private static assertDestinationAvailable(
        destination: string,
        copiedDestinations: Set<string>,
        packageName: string,
        relativePath: string
    ): void {
        if (copiedDestinations.has(destination) || fs.existsSync(destination)) {
            throw new Error(
                `Copy conflict for package "${packageName}": "${relativePath}" would overwrite "${destination}".`
            );
        }
    }

    private static log(message: string, verbose?: boolean): void {
        if (verbose) {
            console.log(message);
        }
    }
}

export { PluginManager };
