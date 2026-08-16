import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
    title: 'PluginManager-JS',
    tagline: 'Organize front-end packages and static assets with declarative rules.',
    favicon: 'img/favicon.ico',

    url: 'https://carry0987.github.io',
    baseUrl: '/PluginManager-JS/',

    organizationName: 'carry0987',
    projectName: 'PluginManager-JS',

    // The broken links detection is only available for a production build
    onBrokenLinks: 'throw',

    // Global markdown configuration
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: 'warn',
            onBrokenMarkdownImages: 'throw',
        },
    },

    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            '@docusaurus/preset-classic',
            {
                sitemap: {
                    changefreq: 'weekly',
                    priority: 0.5,
                },
                docs: {
                    sidebarPath: './sidebars.ts',
                    showLastUpdateAuthor: true,
                    showLastUpdateTime: true,
                    editUrl: 'https://github.com/carry0987/PluginManager-JS/tree/gh-pages/',
                },
                blog: false,
                theme: {
                    customCss: './src/css/global.custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        navbar: {
            title: 'PluginManager-JS',
            logo: {
                alt: 'PluginManager-JS Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docsSidebar',
                    position: 'left',
                    label: 'Docs',
                },
                { to: '/docs/getting-started', label: 'Getting Started', position: 'left' },
                {
                    href: 'https://www.npmjs.com/package/@carry0987/plugin-manager',
                    label: 'NPM',
                    position: 'right',
                },
                {
                    href: 'https://github.com/carry0987/PluginManager-JS',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            label: 'Introduction',
                            to: '/docs/intro',
                        },
                        {
                            label: 'API Reference',
                            to: '/docs/api-reference',
                        },
                    ],
                },
                {
                    title: 'Package',
                    items: [
                        {
                            label: 'NPM',
                            href: 'https://www.npmjs.com/package/@carry0987/plugin-manager',
                        },
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'GitHub',
                            href: 'https://github.com/carry0987/PluginManager-JS',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} carry0987. Built with Docusaurus.`,
        },
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
        prism: {
            theme: prismThemes.oneDark,
            darkTheme: prismThemes.oneDark,
            additionalLanguages: ['tsx', 'css', 'json', 'bash'],
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
