---
sidebar_position: 4
title: API Reference
---

## Import

```ts
import {
    PluginManager,
    version,
    type CopyFilesOptions,
    type CopyPackagesOptions,
    type OperationOptions,
    type PackageRule,
} from '@carry0987/plugin-manager';
```

## `PluginManager.emptyDir(targetDir, options?)`

```ts
PluginManager.emptyDir(targetDir: string, options?: OperationOptions): void
```

Creates the target directory if needed and removes everything inside it while keeping the root directory itself.

Use this to reset a build output folder before copying assets.

## `PluginManager.copyPackages(sourceDir, targetDir, rules, options?)`

```ts
PluginManager.copyPackages(
    sourceDir: string,
    targetDir: string,
    rules: PackageRule[],
    options?: CopyPackagesOptions,
): void
```

Copies files from installed packages into the output directory using declarative rules.

### Rule fields

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Package name, including scoped packages such as `@scope/pkg` |
| `from` | `string` | Source subdirectory inside the package, defaulting to `dist` |
| `to` | `string` | Writes output to `targetDir/<package-name>/<to>/...` |
| `include` | `string[]` | `micromatch` patterns to keep |
| `exclude` | `string[]` | `micromatch` patterns to remove after inclusion |
| `optional` | `boolean` | Skips missing packages or source directories instead of throwing |

### Behavior notes

- Each rule is always constrained to `targetDir/<package-name>/...`
- If `include` is omitted, all files are considered included
- If a destination file already exists, or two rules target the same file, an error is thrown
- `name`, `from`, and `to` cannot be absolute paths or use `..` to escape the allowed scope

### Possible errors

- The package does not exist and `optional !== true`
- The requested `from` directory does not exist and `optional !== true`
- A rule field uses an invalid path
- Multiple rules would overwrite the same output file

## `PluginManager.copyFiles(sourceDir, targetDir, options?)`

```ts
PluginManager.copyFiles(
    sourceDir: string,
    targetDir: string,
    options?: CopyFilesOptions,
): void
```

Copies files from a normal local directory into the target directory while preserving relative paths.

### `CopyFilesOptions`

```ts
type CopyFilesOptions = {
    verbose?: boolean;
    include?: string[];
    exclude?: string[];
};
```

### Behavior notes

- `sourceDir` must exist and be a directory
- `include` defaults to `['**/*']`
- `exclude` is applied after `include`

## `PluginManager.clearUnnecessaryFiles(targetDir, patterns, options?)`

```ts
PluginManager.clearUnnecessaryFiles(
    targetDir: string,
    patterns: string[],
    options?: OperationOptions,
): void
```

Removes every file in `targetDir` that does not match the provided patterns.

This is a retain-style cleanup step, useful when you only want specific file types or paths in deployment output.

## `PluginManager.clearEmptyDirs(directory, options?)`

```ts
PluginManager.clearEmptyDirs(directory: string, options?: OperationOptions): boolean
```

Recursively removes empty directories and returns whether the directory is empty after processing.

It is commonly used after `clearUnnecessaryFiles()` to remove directories left empty by file cleanup.

## `PluginManager.removeDirs(dirs, options?)`

```ts
PluginManager.removeDirs(dirs: string[], options?: OperationOptions): void
```

Removes the specified directories. Missing paths are ignored.

## Public types

```ts
type OperationOptions = {
    verbose?: boolean;
};

type PackageRule = {
    name: string;
    from?: string;
    to?: string;
    include?: string[];
    exclude?: string[];
    optional?: boolean;
};

type CopyPackagesOptions = OperationOptions;
```

## `version`

```ts
export const version: string;
```

The package exports a `version` string constant that can be displayed at runtime. Its value is injected during the build process.

## `verbose`

Most methods accept `OperationOptions` or a derived type. When you pass:

```ts
{ verbose: true }
```

copy, delete, and skip operations are logged to the console, which helps when debugging a build pipeline.