/**
 * Property tests: random operation sequences on a grid in every collision mode, with every
 * layout invariant checked after each step. fast-check shrinks a failure to its shortest
 * sequence; add each one to layout-regressions.test.ts once it is fixed.
 */
import { describe, expect, inject, test } from 'vitest';
import fc from 'fast-check';

import { useLayoutHarness } from './layout-harness';
import { opArb, runScenario, type ScenarioConfig } from './layout-ops';

const { resizeTo } = useLayoutHarness();

// CI runs the cheap default; raise LAYOUT_PROPERTY_RUNS / LAYOUT_PROPERTY_MAX_OPS locally to
// hunt for new counterexamples. vitest.config.ts reads them and provides them to every
// environment, browsers included (a browser has no process.env).
const RUNS = inject('layoutPropertyRuns');
const MAX_OPS = inject('layoutPropertyMaxOps');

const configs: ScenarioConfig[] = [
	{ collision: 'none', rows: 6, withPatches: false },
	{ collision: 'none', rows: 0, withPatches: false },
	{ collision: 'none', rows: 6, withPatches: true },
	{ collision: 'push', rows: 0, withPatches: true },
	{ collision: 'compress', rows: 0, withPatches: true },
	{ collision: 'push', rows: 0, withPatches: true, gap: 10 },
	{ collision: 'none', rows: 6, withPatches: false, breakpointCols: { xs: 2, md: 4, lg: 6 } },
	{ collision: 'push', rows: 0, withPatches: true, breakpointCols: { xs: 2, md: 4, lg: 6 } },
	{ collision: 'shift', rows: 0, withPatches: true },
	{ collision: 'shift', rows: 0, withPatches: true, gap: 10 },
	{ collision: 'shift', rows: 0, withPatches: true, breakpointCols: { xs: 2, md: 4, lg: 6 } },
	{ collision: 'none', rows: 6, withPatches: true, gap: 3, cell: 37.5 },
	{ collision: 'push', rows: 0, withPatches: true, gap: 3, cell: 37.5 },
	{ collision: 'shift', rows: 0, withPatches: true, gap: 3, cell: 37.5 }
];

describe.each(configs)('random operations ($collision, rows=$rows, patches=$withPatches)', (config) => {
	test('keep every layout invariant after each step', async () => {
		// fc.assert throws on a counterexample; the assertion makes that explicit.
		await expect(
			fc.assert(
				fc.asyncProperty(fc.array(opArb(config), { minLength: 1, maxLength: MAX_OPS }), (ops) =>
					runScenario(config, ops, resizeTo)
				),
				{ numRuns: RUNS }
			)
		).resolves.toBeUndefined();
	}, 1_200_000);
});
