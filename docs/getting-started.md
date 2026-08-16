---
sidebar_position: 2
title: Getting Started
---

## Installation

```bash
pnpm add @carry0987/plugin-manager
```

## Minimal working example

The example below shows a typical asset assembly flow:

```ts
import { PluginManager } from '@carry0987/plugin-manager';

const targetDir = 'public/vendor';

PluginManager.emptyDir(targetDir);

PluginManager.copyPackages('node_modules', targetDir, [
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
        name: '@scope/example-pkg',
        from: 'dist',
        include: ['**/*.js'],
        optional: true,
    },
]);

PluginManager.copyFiles('src/assets', targetDir, {
    include: ['**/*'],
    exclude: ['**/*.map'],
});

PluginManager.clearUnnecessaryFiles(targetDir, ['**/*.js', '**/*.css', '**/*.svg']);
PluginManager.clearEmptyDirs(targetDir);
```

## What this script does

1. `emptyDir()` keeps the `public/vendor` root folder but removes old files inside it.
2. `copyPackages()` selects release assets from `node_modules` by rule.
3. `copyFiles()` adds local assets from `src/assets` into the same output tree.
4. `clearUnnecessaryFiles()` keeps only the allowed file types and removes the rest.
5. `clearEmptyDirs()` removes any empty folders left after cleanup.

## How package rules are written to disk

`copyPackages()` does not flatten everything directly into `targetDir`. Each rule is written under its package name, for example:

```text
public/vendor/
├── bootstrap/
│   ├── bootstrap.bundle.min.js
│   └── bootstrap.min.css
├── jquery/
│   └── jquery.min.js
└── @scope/
    └── example-pkg/
        └── scoped.js
```

If a rule sets `to: 'icons'`, the files will be placed in `targetDir/<package-name>/icons/...`.

## `include` and `exclude`

Filtering uses `micromatch` patterns:

- If `include` is omitted, the default is `['**/*']`
- `exclude` is applied after `include`
- Matching runs against relative paths, not absolute paths

Common patterns:

```ts
include: ['**/*.js', '**/*.css']
exclude: ['**/*.map', '**/*.test.js']
```

## When to use `optional`

If a package is only installed in some projects, environments, or optional features, mark it like this:

```ts
{
    name: 'some-optional-package',
    optional: true,
}
```

If the package does not exist, or the requested `from` directory is missing, the rule is skipped instead of failing the whole build.

## Next steps

- For more end-to-end patterns, read [Common Workflows](./workflows.md)
- For every public method and type, read [API Reference](./api-reference.md)