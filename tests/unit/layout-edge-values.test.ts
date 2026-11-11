import { expect, test } from 'vitest';
import { FIXED_SIZE, MODES, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

/**
 * Props a page may pass by mistake. Each must end in a valid layout: whole cells, inside the
 * grid, drawn where bound, without throwing or hanging (NaN sizes and y = 1e6 in compress mode
 * both used to hang). A bound `w` or `h` of undefined is left out: Svelte itself rejects
 * binding undefined to a prop with a fallback (props_invalid_value).
 */
const VALUES = [Number.NaN, Infinity, -Infinity, -5, 0, 1.5, 1e6, undefined] as const;
const FIELDS = ['x', 'y', 'w', 'h'] as const;
const cases = MODES.flatMap((collision) =>
	FIELDS.flatMap((field) =>
		VALUES.filter((value) => value !== undefined || field === 'x' || field === 'y').map((value) => ({
			collision,
			field,
			value: value as number
		}))
	)
);

test.each(cases)('registering $field=$value ($collision)', async ({ collision, field, value }) => {
	const grid = mountLayout({
		grid: { cols: 4, rows: 4, collision, ...FIXED_SIZE },
		items: [item('a', 0, 0), { ...item('b', 1, 1), [field]: value }]
	});
	await grid.settle();
	expect(layoutProblems(grid, { collision, cols: 4, rows: 4 })).toEqual([]);
});

test.each(cases)('patching $field=$value ($collision)', async ({ collision, field, value }) => {
	const grid = mountLayout({
		grid: { cols: 4, rows: 4, collision, ...FIXED_SIZE },
		items: [item('a', 0, 0), item('b', 1, 1)]
	});
	await grid.settle();
	grid.component.patch('b', { [field]: value });
	await grid.settle();
	expect(layoutProblems(grid, { collision, cols: 4, rows: 4 })).toEqual([]);
});
