import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { svelteTesting } from '@testing-library/svelte/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

import { mouse, touch } from './tests/browser/commands';

const UNIT_TESTS = ['tests/unit/**/*.test.ts'];
const STRESS_TESTS = ['tests/stress/**/*.test.ts'];

// Property-test effort, provided to every environment (see layout-properties.test.ts; the
// types are in tests/provided-context.d.ts).
const PROPERTY_EFFORT = {
	layoutPropertyRuns: Number(process.env.LAYOUT_PROPERTY_RUNS ?? 60),
	layoutPropertyMaxOps: Number(process.env.LAYOUT_PROPERTY_MAX_OPS ?? 12)
};

/**
 * The unit suite in a real browser engine: the same files as the jsdom project, with real
 * layout, observers and (through the harness) real mouse input. One builder for every
 * engine, so the browsers cannot drift apart from each other or from jsdom.
 */
function browserProject(browser: 'chromium' | 'firefox', deviceScaleFactor = 1) {
	return {
		extends: true as const,
		// Svelte's package exports a server build by default; components must mount in the page.
		resolve: { conditions: ['browser'] },
		test: {
			name: deviceScaleFactor === 1 ? browser : `${browser}-${deviceScaleFactor}x`,
			include: [...UNIT_TESTS, ...STRESS_TESTS],
			// Real mouse input goes to page coordinates; with files in parallel their iframes
			// share the page and a press can land in another file's iframe.
			fileParallelism: false,
			browser: {
				enabled: true,
				// The outer window is bigger than the test viewport, so the test iframe is not
				// scaled down to fit it: real mouse input then lands 1:1 in every engine.
				// A device scale above 1 rounds layout to device pixels differently per engine.
				provider: playwright({
					contextOptions: { viewport: { width: 1700, height: 1300 }, deviceScaleFactor },
					// The leak tests force collections and read the heap where the engine allows it.
					launchOptions:
						browser === 'chromium' ? { args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'] } : {}
				}),
				headless: true,
				// Large enough that the harness grids (100px cells) and their drags stay on screen.
				viewport: { width: 1600, height: 1200 },
				instances: [{ browser }],
				commands: { mouse, touch },
				// Failures are reported as text; screenshots would land next to the test files.
				screenshotFailures: false
			}
		}
	};
}

export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	test: {
		globals: true,
		environment: 'jsdom',
		provide: PROPERTY_EFFORT,
		projects: [
			{ extends: true, test: { name: 'unit', include: UNIT_TESTS } },
			browserProject('chromium'),
			browserProject('firefox'),
			browserProject('chromium', 1.5),
			browserProject('firefox', 1.5),
			{
				extends: true,
				test: {
					name: 'stress',
					include: STRESS_TESTS,
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
