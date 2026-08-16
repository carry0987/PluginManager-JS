# PluginManager-JS
[![NPM](https://img.shields.io/npm/v/@carry0987/plugin-manager.svg)](https://www.npmjs.com/package/@carry0987/plugin-manager)
![CI](https://github.com/carry0987/PluginManager-JS/actions/workflows/ci.yml/badge.svg)  

`@carry0987/plugin-manager` helps you prepare front-end assets from installed packages and local directories with declarative rules.

Full documentation is available on GitHub Pages:

- [Documentation Home](https://carry0987.github.io/PluginManager-JS/)
- [Getting Started](https://carry0987.github.io/PluginManager-JS/docs/getting-started)
- [API Reference](https://carry0987.github.io/PluginManager-JS/docs/api-reference)

## Installation

```sh
pnpm add @carry0987/plugin-manager
```

## Quick Example

```typescript
import { PluginManager } from '@carry0987/plugin-manager';

PluginManager.emptyDir('public/vendor');

PluginManager.copyPackages('node_modules', 'public/vendor', [
	{
		name: 'bootstrap',
		from: 'dist',
		include: ['**/bootstrap.bundle.min.js', '**/bootstrap.min.css'],
	},
]);

PluginManager.copyFiles('src/assets', 'public/vendor', {
	exclude: ['**/*.map'],
});

PluginManager.clearUnnecessaryFiles('public/vendor', ['**/*.js', '**/*.css']);
PluginManager.clearEmptyDirs('public/vendor');
```

## Links

- [NPM](https://www.npmjs.com/package/@carry0987/plugin-manager)
- [GitHub](https://github.com/carry0987/PluginManager-JS)
- [Issues](https://github.com/carry0987/PluginManager-JS/issues)

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
