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
	},
	{
		name: 'removing several items in one tick leaves the rest compressed',
		config: { collision: 'compress', rows: 0, withPatches: true },
		ops: [
			{
				kind: 'batch',
				ops: [
					{ kind: 'addUnplaced', w: 1, h: 1 },
					{ kind: 'addUnplaced', w: 1, h: 1 }
				]
			},
			{
				kind: 'batch',
				ops: [
					{ kind: 'addFree', w: 3, h: 1 },
					{ kind: 'addUnplaced', w: 2, h: 2 }
				]
			},
			{
				kind: 'batch',
				ops: [
					{ kind: 'remove', pick: 0 },
					{ kind: 'remove', pick: 0 },
					{ kind: 'remove', pick: 0 }
				]
			},
			{ kind: 'patch', pick: 0, x: 0, y: 0, w: 1, h: 1 }
		]
	},
	{
		name: 'removing items and patching another in one tick leaves the rest compressed',
		config: { collision: 'compress', rows: 0, withPatches: true },
		ops: [
			{
				kind: 'batch',
				ops: [
					{ kind: 'addFree', w: 1, h: 1 },
					{ kind: 'addUnplaced', w: 1, h: 1 },
					{ kind: 'addFree', w: 1, h: 1 }
				]
			},
			{
				kind: 'batch',
				ops: [
					{ kind: 'addUnplaced', w: 1, h: 2 },
					{ kind: 'patch', pick: 99_434_095, x: 0, y: 3, w: 1, h: 1 }
				]
			},
			{
				kind: 'batch',
				ops: [
					{ kind: 'remove', pick: 0 },
					{ kind: 'remove', pick: 336_429_855 },
					{ kind: 'patch', pick: 0, x: 0, y: 0, w: 1, h: 1 }
				]
			},
			{ kind: 'drag', pick: 0, dx: 0, dy: 0 }
		]
	},
	{
		name: 'switching from none back to compress mid-drag compresses what none left',
		config: { collision: 'compress', rows: 0, withPatches: true },
		ops: [
			{
				kind: 'batch',
				ops: [
					{ kind: 'addUnplaced', w: 1, h: 1 },
					{ kind: 'addUnplaced', w: 1, h: 1 }
				]
			},
			{
				kind: 'dragWild',
				pick: 0,
				fast: false,
				steps: [
					{ kind: 'op', op: { kind: 'patch', pick: 0, x: 0, y: 0, w: 4, h: 2 } },
					{ kind: 'flip', to: 'none' },
					{ kind: 'op', op: { kind: 'addFree', w: 1, h: 1 } }
				]
			},
			{ kind: 'containerResize' }
		]
	},
	{
		name: 'switching from none back to shift mid-drag separates items none let overlap',
		config: { collision: 'shift', rows: 0, withPatches: true },
		ops: [
			{
				kind: 'batch',
				ops: [
					{ kind: 'addFree', w: 1, h: 1 },
					{ kind: 'addUnplaced', w: 1, h: 1 }
				]
			},
			{
				kind: 'dragWild',
				pick: 0,
				fast: false,
				steps: [
					{ kind: 'flip', to: 'none' },
					{ kind: 'op', op: { kind: 'patch', pick: 1_342_207_575, x: 0, y: 0, w: 1, h: 1 } },
					{ kind: 'move', dx: 0, dy: 0 }
				]
			},
			{ kind: 'cols', cols: 2 }
		]
	}
];

test.each(cases)('$name', ({ config, ops }) => runScenario(config, ops, resizeTo));
