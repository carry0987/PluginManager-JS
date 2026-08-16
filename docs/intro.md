---
sidebar_position: 1
---

# PluginManager-JS

`@carry0987/plugin-manager` is a Node.js and TypeScript utility for assembling front-end package assets and local static files into a predictable output directory.

It is a good fit when you need to:

- Prepare front-end assets for templates, themes, or plugin-based systems
- Select only the `js`, `css`, `svg`, or other release files you want from `node_modules`
- Combine third-party packages with local project assets in one deployment folder
- Reset build output before each run, then clean unnecessary files and empty directories afterward

## Core capabilities

### Declarative rules instead of scattered copy scripts

`copyPackages()` lets you describe which package to read, which subdirectory to use, which files to keep, and where they should land, without writing custom copy logic for every dependency.

### Stable and predictable output structure

Every package rule is constrained to this output scope:

```text
targetDir/<package-name>/...
```

If `to` is provided, files are copied to:

```text
targetDir/<package-name>/<to>/...
```

This makes output paths predictable and prevents rules from accidentally writing outside the intended package directory.

### Built-in safety checks

The implementation already guards against several common mistakes:

- `name`, `from`, and `to` must be relative paths
- `..` cannot be used to escape the allowed package output scope
- If two rules would overwrite the same destination, an error is thrown immediately
- Missing packages or source directories can be skipped with `optional: true`

### Package files and local files can be combined

Alongside `copyPackages()`, you can use `copyFiles()` to copy a normal directory, preserve its relative structure, and filter files with `include` and `exclude` patterns.

## Recommended workflow

Most projects can use this sequence:

1. Use `emptyDir()` to reset the output directory
2. Use `copyPackages()` to bring in third-party assets
3. Use `copyFiles()` to add local templates or overrides
4. Use `clearUnnecessaryFiles()` to keep only what should ship
5. Use `clearEmptyDirs()` to remove empty folders left behind

Continue with [Getting Started](./getting-started.md), or jump to the [API Reference](./api-reference.md) for the full method and type surface.
