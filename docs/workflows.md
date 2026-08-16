---
sidebar_position: 3
title: Common Workflows
---

## Workflow 1: Collect third-party front-end assets

If you do not want to copy an entire `dist` folder into your deployment output, define the exact files you want for each package.

```ts
PluginManager.copyPackages('node_modules', 'template/plugins', [
    {
        name: 'example-pkg',
        from: 'dist',
        include: ['**/example.bundle.min.js', '**/example.min.css'],
    },
    {
        name: 'example-pkg',
        from: 'docs',
        include: ['**/*.md'],
    },
    {
        name: 'example-pkg',
        from: 'assets/icon',
        to: 'icons',
        include: ['**/*.svg'],
    },
]);
```

This produces a structure like:

```text
template/plugins/
└── example-pkg/
    ├── example.bundle.min.js
    ├── example.min.css
    ├── example.md
    └── icons/
        └── logo.svg
```

## Workflow 2: Mix local assets with package assets

If you maintain your own templates or overrides, copy third-party assets first and then add local files:

```ts
PluginManager.emptyDir('public/vendor');

PluginManager.copyPackages('node_modules', 'public/vendor', [
    {
        name: 'sweetalert2',
        from: 'dist',
        include: ['**/sweetalert2.min.js', '**/sweetalert2.min.css'],
    },
]);

PluginManager.copyFiles('src/vendor-overrides', 'public/vendor', {
    include: ['**/*'],
    exclude: ['**/*.psd'],
});
```

This pattern works well because:

- Third-party asset sources stay explicit
- Local overrides remain versioned inside your project
- Everything ends up in one deployment directory

## Workflow 3: Keep only deployable files

If upstream sources contain `.map` files, examples, or other files you do not want to publish, finish with a retain-style cleanup step:

```ts
PluginManager.clearUnnecessaryFiles('public/vendor', ['**/*.js', '**/*.css', '**/*.svg']);
PluginManager.clearEmptyDirs('public/vendor');
```

`clearUnnecessaryFiles()` is not designed as “delete these files”; it is designed as “keep only files that match these rules.” That makes deployment output easier to reason about.

## Workflow 4: Handle optional packages

Some packages only exist in certain client projects or feature sets. In that case, `optional` reduces build coupling:

```ts
PluginManager.copyPackages('node_modules', 'public/vendor', [
    {
        name: 'feature-plugin',
        from: 'dist',
        include: ['**/*.js'],
        optional: true,
    },
]);
```

When the package is missing, the rule is skipped instead of throwing.

## Workflow 5: Fail early on conflicting rules

If two rules would write to the same destination file, `copyPackages()` throws immediately instead of silently overwriting output.

```ts
PluginManager.copyPackages('node_modules', 'public/vendor', [
    {
        name: 'conflict-pkg',
        from: 'dist',
        include: ['**/*.txt'],
    },
    {
        name: 'conflict-pkg',
        from: 'docs',
        include: ['**/*.txt'],
    },
]);
```

Treat this as a rule design problem. Adjust `include`, `from`, or `to` instead of relying on overwrite order.