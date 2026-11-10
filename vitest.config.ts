import { defineConfig } from 'vitest/config';
import { svelteTesting } from '@testing-library/svelte/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	test: {
		globals: true,
		environment: 'jsdom',
		projects: [
			{ extends: true, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] } },
			{
				extends: true,
				test: {
					name: 'stress',
					include: ['tests/stress/**/*.test.ts'],
					// Leak tests call gc() to tell a released grid from a retained one.
					pool: 'forks',
					execArgv: ['--expose-gc']
				}
			}
		],
		coverage: {
			reporter: ['text', 'json', 'html'],
			provider: 'v8',
			// The demo routes under src/routes are not part of the published package;
			// including them buried the library's own numbers under 0% noise.
			include: ['src/lib/**']
		}
	}
});
