import { defineConfig } from 'vitest/config';
import { svelteTesting } from '@testing-library/svelte/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	test: {
		include: ['**/tests/**/*.test.ts'],
		globals: true,
		environment: 'jsdom',
		coverage: {
			reporter: ['text', 'json', 'html'],
			provider: 'v8',
			// The demo routes under src/routes are not part of the published package;
			// including them buried the library's own numbers under 0% noise.
			include: ['src/lib/**']
		}
	}
});
