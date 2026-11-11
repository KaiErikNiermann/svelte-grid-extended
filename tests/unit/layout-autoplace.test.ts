import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, MODES, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();
describe('items without a position', () => {
	test.each(MODES)('are placed in the first free cell (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add({ id: 'b', w: 1, h: 1 });
		await grid.settle();

		expect(grid.component.snapshot().find((i) => i.id === 'b')).toMatchObject({ x: 1, y: 0 });
		expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
	});
});

describe('items declared on an occupied cell', () => {
	test.each(['push', 'compress'] as const)('do not overlap after the first mount (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 4, collision, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 0, 0)]
		});
		await grid.settle();

		expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
	});

	test.each(['push', 'compress'] as const)('do not overlap when added later (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add(item('b', 0, 0));
		await grid.settle();

		expect(grid.component.snapshot().find((i) => i.id === 'a')).toMatchObject({ x: 0, y: 0 });
		expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
	});

	test('keep their cell in none mode, which allows overlap', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0), item('b', 0, 0)] });
		await grid.settle();

		expect(grid.component.snapshot()).toEqual([item('a', 0, 0), item('b', 0, 0)]);
	});
});
