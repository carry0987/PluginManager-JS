import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        coverage: {
            // Test coverage options (optional)
            reporter: ['text', 'json', 'html'],
        }
    },
});
