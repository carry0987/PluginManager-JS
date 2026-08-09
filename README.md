# PluginManager-JS
[![NPM](https://img.shields.io/npm/v/@carry0987/plugin-manager.svg)](https://www.npmjs.com/package/@carry0987/plugin-manager)
![CI](https://github.com/carry0987/PluginManager-JS/actions/workflows/ci.yml/badge.svg)  

The `@carry0987/plugin-manager` library provides utility functions for preparing front-end assets from local directories and installed packages. It focuses on declarative file selection instead of scanning every `dist` folder under `node_modules`.

## Installation
You can install the library via:

```sh
pnpm add @carry0987/plugin-manager
```

## Usage
Here's an example of how you can use the `@carry0987/plugin-manager` library in your project:

```typescript
import { PluginManager } from '@carry0987/plugin-manager';

const sourceDir = 'path/to/source';
const targetDir = 'path/to/target';

// Empty a target directory while keeping the root folder
PluginManager.emptyDir(targetDir);

// Copy package assets declaratively
PluginManager.copyPackages('node_modules', targetDir, [
	{
		name: '@carry0987/utils-full',
		from: 'dist',
	},
	{
		name: 'bootstrap',
		from: 'dist',
		include: ['**/bootstrap.bundle.min.js', '**/bootstrap.min.css'],
	},
	{
		name: 'jquery',
		from: 'dist',
		include: ['**/jquery.min.js'],
	},
	{
		name: 'select2',
		from: 'dist',
		include: ['**/select2.min.js', '**/select2.min.css'],
	},
	{
		name: 'sweetalert2',
		from: 'dist',
		include: ['**/sweetalert2.min.js', '**/sweetalert2.min.css'],
	},
]);

// Copy arbitrary files with include/exclude filters
PluginManager.copyFiles(sourceDir, targetDir, {
	include: ['**/*'],
	exclude: ['**/*.map'],
});

// Clear unnecessary files
PluginManager.clearUnnecessaryFiles(targetDir, ['*.js']);

// Clear empty directories
PluginManager.clearEmptyDirs(sourceDir);

// Remove directories
PluginManager.removeDirs([targetDir]);
```

## API

### `emptyDir(targetDir: string, options?: OperationOptions): void`
Ensures the target directory exists and removes all contents inside it while keeping the root directory in place.

### `copyPackages(sourceDir: string, targetDir: string, rules: PackageRule[], options?: CopyPackagesOptions): void`
Copies files from installed packages based on declarative rules. Each rule resolves `sourceDir/name`, defaults `from` to `dist`, optionally copies into `targetDir/name/to`, and filters files with `include` and `exclude` micromatch patterns.

### `copyFiles(sourceDir: string, targetDir: string, options?: CopyFilesOptions): void`
Copies files from the source directory to the target directory using `include` and `exclude` micromatch patterns. Relative directory structure is preserved.

### `clearUnnecessaryFiles(targetDir: string, patterns: string[], options?: OperationOptions): void`
Removes files in the target directory whose relative paths do not match the provided micromatch patterns.

### `clearEmptyDirs(directory: string, options?: OperationOptions): boolean`
Removes empty directories under the specified directory. Recursively checks each subdirectory, removing any that are empty. Returns `true` if the directory is empty.

### `removeDirs(dirs: string[], options?: OperationOptions): void`
Removes specified directories when they exist.

### `PackageRule`

```ts
type PackageRule = {
	name: string;
	from?: string;
	to?: string;
	include?: string[];
	exclude?: string[];
	optional?: boolean;
};
```

### `CopyFilesOptions`

```ts
type CopyFilesOptions = {
	include?: string[];
	exclude?: string[];
	verbose?: boolean;
};
```

## Private Utility Methods
These methods are intended for internal use within the `PluginManager` class.

### `removeDir(dirPath: string): void`
Recursively removes the specified directory and its contents.

### `getAllFiles(dir: string, rootDir?: string, fileList?: FileEntry[]): FileEntry[]`
Recursively collects all files from the directory and stores each file with its absolute and relative path.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
