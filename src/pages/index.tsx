import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { Highlight, themes } from 'prism-react-renderer';
import type { ReactNode } from 'react';

import styles from './index.module.css';

const workflowCode = `PluginManager.emptyDir('public/vendor');

PluginManager.copyPackages('node_modules', 'public/vendor', [
    {
        name: 'bootstrap',
        from: 'dist',
        include: ['**/bootstrap.bundle.min.js', '**/bootstrap.min.css'],
    },
]);

PluginManager.copyFiles('src/assets', 'public/vendor', {
    exclude: ['**/*.map'],
});`;

function WorkflowCodeBlock() {
    return (
        <Highlight code={workflowCode} language="ts" theme={themes.nightOwl}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={clsx(className, styles.previewCode)} style={{ ...style, background: 'transparent' }}>
                    {tokens.map((line, lineIndex) => {
                        const lineProps = getLineProps({ line });

                        return (
                            <div key={lineIndex} {...lineProps} className={styles.codeLine}>
                                <span className={styles.lineNumber}>{lineIndex + 1}</span>
                                <span className={styles.lineContent}>
                                    {line.map((token, tokenIndex) => (
                                        <span key={tokenIndex} {...getTokenProps({ token })} />
                                    ))}
                                </span>
                            </div>
                        );
                    })}
                </pre>
            )}
        </Highlight>
    );
}

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero', styles.heroBanner)}>
            <div className="container">
                <div className={styles.heroGrid}>
                    <div className={styles.heroCopy}>
                        <p className={styles.eyebrow}>@carry0987/plugin-manager</p>
                        <Heading as="h1" className={styles.heroTitle}>
                            Organize front-end assets with rules instead of hand-written copy scripts
                        </Heading>
                        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
                        <div className={styles.buttons}>
                            <Link className="button button--primary button--lg" to="/docs/getting-started">
                                Get Started
                            </Link>
                            <Link className="button button--secondary button--lg" to="/docs/api-reference">
                                API Reference
                            </Link>
                        </div>
                        <ul className={styles.heroList}>
                            <li>Supports scoped packages and micromatch filtering</li>
                            <li>Blocks path escapes and destination overwrite conflicts</li>
                            <li>Covers reset, copy, filter, and cleanup steps</li>
                        </ul>
                    </div>
                    <div className={styles.previewPanel}>
                        <div className={styles.previewHeader}>
                            <span className={styles.previewDot} />
                            Typical workflow
                        </div>
                        <WorkflowCodeBlock />
                        <p className={styles.previewNote}>
                            Output is always constrained to targetDir/&lt;package-name&gt;/...
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={siteConfig.title}
            description="PluginManager-JS documentation for assembling front-end packages and static assets with declarative rules.">
            <HomepageHeader />
            <main>
                <HomepageFeatures />
                <section className={styles.workflowSection}>
                    <div className="container">
                        <div className={styles.workflowHeading}>
                            <p className={styles.workflowLabel}>Workflow</p>
                            <Heading as="h2">Recommended sequence</Heading>
                        </div>
                        <div className={styles.workflowGrid}>
                            <article className={styles.workflowCard}>
                                <span className={styles.workflowIndex}>01</span>
                                <Heading as="h3">Reset the output directory</Heading>
                                <p>
                                    Use <code>emptyDir()</code> to keep the root directory in place while removing old
                                    output before each build.
                                </p>
                            </article>
                            <article className={styles.workflowCard}>
                                <span className={styles.workflowIndex}>02</span>
                                <Heading as="h3">Copy package and local files</Heading>
                                <p>
                                    Run <code>copyPackages()</code> first, then use <code>copyFiles()</code> for local
                                    templates, overrides, and extra assets.
                                </p>
                            </article>
                            <article className={styles.workflowCard}>
                                <span className={styles.workflowIndex}>03</span>
                                <Heading as="h3">Clean and verify output</Heading>
                                <p>
                                    Finish with <code>clearUnnecessaryFiles()</code> and <code>clearEmptyDirs()</code>{' '}
                                    to remove unwanted files and empty folders.
                                </p>
                            </article>
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    );
}
