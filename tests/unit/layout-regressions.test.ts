/**
 * Shrunk counterexamples found by the layout property tests, replayed exactly.
 */
import { test } from 'vitest';

import { useLayoutHarness } from './layout-harness';
import { runScenario, type Op, type ScenarioConfig } from './layout-ops';

const { resizeTo } = useLayoutHarness();

const noneFixedRows: ScenarioConfig = { collision: 'none', rows: 6, withPatches: false };

const cases: { name: string; config: ScenarioConfig; ops: Op[] }[] = [
	{
		name: 'an item left overlapping in a full grid moves once more columns free a cell',
		config: noneFixedRows,
		ops: [
			{ kind: 'addFree', w: 2, h: 3 },
			{ kind: 'addFree', w: 3, h: 2 },
			{ kind: 'addUnplaced', w: 3, h: 2 },
			{ kind: 'cols', cols: 5 }
		]
	},
	{
		name: 'an item left overlapping in a full grid moves once a resize frees a cell',
		config: noneFixedRows,
		ops: [
			{ kind: 'addUnplaced', w: 3, h: 3 },
			{ kind: 'addUnplaced', w: 3, h: 2 },
			{ kind: 'addUnplaced', w: 2, h: 2 },
			{ kind: 'resize', pick: 821_167_441, dw: -2, dh: 0 },
			{ kind: 'addUnplaced', w: 1, h: 1 }
		]
	},
	{
		name: 'an item left overlapping in a full grid moves once a removal frees a cell',
		config: noneFixedRows,
		ops: [
			{ kind: 'addUnplaced', w: 1, h: 1 },
			{ kind: 'cols', cols: 2 },
			{ kind: 'addUnplaced', w: 2, h: 2 },
			{ kind: 'addFree', w: 2, h: 3 },
			{ kind: 'resize', pick: 0, dw: 1, dh: 0 },
			{ kind: 'addUnplaced', w: 1, h: 1 },
			{ kind: 'remove', pick: 65_685_185 }
		]
	}
];

test.each(cases)('$name', ({ config, ops }) => runScenario(config, ops, resizeTo));
