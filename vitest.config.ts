import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            {
                resolve: {
                    alias: {
                        '@': path.resolve(__dirname, 'src')
                    }
                }
            }
        ],
        environment: 'node',
        coverage: {
            // Test coverage options (optional)
            reporter: ['text', 'json', 'html']
        }
    }
});
