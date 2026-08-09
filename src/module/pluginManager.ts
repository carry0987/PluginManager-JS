import fs from 'node:fs';
import path from 'node:path';
import micromatch, { type Options as MicromatchOptions } from 'micromatch';
import type { CopyFilesOptions, CopyPackagesOptions, FileEntry, OperationOptions, PackageRule } from '@/types';

class PluginManager {
    static emptyDir(targetDir: string, options: OperationOptions = {}): void {
        fs.mkdirSync(targetDir, { recursive: true });

        for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
            const fullPath = path.join(targetDir, entry.name);
            PluginManager.removeDir(fullPath);
            PluginManager.log(`Removed: ${fullPath}`, options.verbose);
        }
    }

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

    static clearUnnecessaryFiles(targetDir: string, patterns: string[], options: OperationOptions = {}): void {
        const files = PluginManager.getAllFiles(targetDir);

        for (const file of files) {
            if (!PluginManager.matchesAnyPattern(file.relativePath, patterns)) {
                fs.unlinkSync(file.absolutePath);
                PluginManager.log(`Removed unnecessary file: ${file.absolutePath}`, options.verbose);
            }
        }
    }

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
