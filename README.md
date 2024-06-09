# PluginManager-JS
[![NPM](https://img.shields.io/npm/v/@carry0987/plugin-manager.svg)](https://www.npmjs.com/package/@carry0987/plugin-manager)
![CI](https://github.com/carry0987/PluginManager-JS/actions/workflows/ci.yml/badge.svg)  

The `@carry0987/plugin-manager` library provides a set of utility functions for managing file operations such as cleaning directories, copying distribution folders, moving files, clearing unnecessary files, and removing empty directories within a file system. This library is designed to streamline and simplify tasks commonly needed for managing plugins, assets, or similar sets of files.

## Installation
You can install the library via npm:

```sh
npm i @carry0987/plugin-manager
```

Or via pnpm:

```sh
pnpm add @carry0987/plugin-manager
```

## Usage
Here's an example of how you can use the `@carry0987/plugin-manager` library in your project:

```typescript
import { PluginManager } from '@carry0987/plugin-manager';

const sourceDir = 'path/to/source';
const targetDir = 'path/to/target';

// Clean directories
PluginManager.cleanDir(sourceDir, targetDir);

// Copy distribution folders
PluginManager.copyDistFolders(sourceDir, targetDir);

// Move files
PluginManager.moveFiles(sourceDir, targetDir);

// Clear unnecessary files
PluginManager.clearUnnecessaryFiles(targetDir, ['*.js']);

// Clear empty directories
PluginManager.clearEmptyDirs(sourceDir);

// Remove directories
PluginManager.removeDirs([targetDir]);
```

## API

### `cleanDir(sourceDir: string, targetDir?: string): void`
Cleans directories within the given source directory. Identifies directory paths to be cleaned and removes them.

### `copyDistFolders(sourceDir: string, targetDir: string): void`
Copies the contents of `dist` directories (often holding distribution-ready files) from the source directory to the target directory. Ensures that the necessary destination directories are created and recursively copies the files.

### `moveFiles(sourceDir: string, targetDir: string, pattern: string = '**/*', matchOption?: MicromatchOptions): void`
Moves files matching a specific pattern from the source directory to the target directory. Supports advanced matching options and ensures that necessary destination directories are created.

### `clearUnnecessaryFiles(targetDir: string, patterns: string[]): void`
Clears unnecessary files in the target directory by removing files that do not match the given patterns.

### `clearEmptyDirs(directory: string): boolean`
Removes empty directories under the specified directory. Recursively checks each subdirectory, removing any that are empty. Returns `true` if the directory is empty, else `false`.

### `removeDirs(dirs: string[]): void`
Removes specified directories, ensuring they exist before attempting the removal.

## Private Utility Methods
These methods are intended for internal use within the `PluginManager` class.

### `removeDir(dirPath: string): void`
Recursively removes the specified directory and its contents.

### `findDistDirs(dir: string, getRealPath?: boolean): string[]`
Finds all `dist` directories within the specified directory.

### `findDestDirs(sourceDir: string, targetDir?: string): string[]`
Identifies directories for cleaning based on the source and optional target directories.

### `copyRecursiveSync(src: string, dest: string): void`
Recursively copies files from the source directory to the destination directory.

### `getAllFiles(dir: string, pattern: string, fileList: string[] = [], matchOption?: MicromatchOptions): string[]`
Recursively collects all files matching the specified pattern from the directory.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
