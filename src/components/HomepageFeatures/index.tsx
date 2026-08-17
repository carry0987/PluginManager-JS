import Heading from '@theme/Heading';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

type FeatureItem = {
    eyebrow: string;
    title: string;
    description: ReactNode;
};

const FeatureList: FeatureItem[] = [
    {
        eyebrow: 'Rule Driven',
        title: 'Describe asset sources with rules',
        description: (
            <>
                Define package names, source folders, included files, and excluded files directly in code so the asset
                pipeline stays readable and maintainable.
            </>
        ),
    },
    {
        eyebrow: 'Safe Output',
        title: 'Constrain output and block overwrites',
        description: (
            <>
                Package output is always confined to <code>targetDir/&lt;package-name&gt;/...</code>, and conflicting
                rules fail fast instead of silently replacing files.
            </>
        ),
    },
    {
        eyebrow: 'Mixed Sources',
        title: 'Assemble package and local files together',
        description: (
            <>
                Copy third-party assets from <code>node_modules</code>, merge in local templates or overrides, and
                finish with cleanup steps in one workflow.
            </>
        ),
    },
];

function Feature({ eyebrow, title, description }: FeatureItem) {
    return (
        <div className={clsx('col col--4')}>
            <div className={styles.card}>
                <p className={styles.eyebrow}>{eyebrow}</p>
                <Heading as="h3">{title}</Heading>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): ReactNode {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className={styles.sectionHeading}>
                    <p className={styles.sectionLabel}>Core Capabilities</p>
                    <Heading as="h2">Turn repetitive asset copying into reviewable rules</Heading>
                </div>
                <div className={clsx('row', styles.featureRow)}>
                    {FeatureList.map((props) => (
                        <Feature key={props.title} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
