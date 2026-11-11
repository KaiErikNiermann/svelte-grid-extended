import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, MODES, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();
describe('grid bounds', () => {
	test.each(MODES)('an item revealed past the last column is moved inside (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 4, rows: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add(item('b', 6, 0));
		await grid.settle();

		expect(grid.component.snapshot().find((i) => i.id === 'b')).toMatchObject({ x: 3, y: 0 });
		expect(layoutProblems(grid, { collision, cols: 4, rows: 4 })).toEqual([]);
	});

	test.each(MODES)('an item wider than the grid is narrowed to fit (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 4, rows: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add(item('b', 0, 1, 6, 1));
		await grid.settle();

		expect(grid.component.snapshot().find((i) => i.id === 'b')).toMatchObject({ x: 0, w: 4 });
		expect(layoutProblems(grid, { collision, cols: 4, rows: 4 })).toEqual([]);
	});

	test.each(MODES)('an x prop past the last column is clamped (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 4, rows: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.patch('a', { x: 9 });
		await grid.settle();

		expect(grid.component.snapshot()).toEqual([item('a', 3, 0)]);
	});

	test('a y prop past the last row is clamped in none mode', async () => {
		const grid = mountLayout({ grid: { cols: 4, rows: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.patch('a', { y: 9 });
		await grid.settle();

		expect(grid.component.snapshot()).toEqual([item('a', 0, 3)]);
	});

	test.each(MODES)('items stay inside when cols shrinks from 4 to 2 (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 4, rows: 4, collision, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 3, 0), item('c', 2, 1, 2, 1)]
		});
		await grid.settle();
		grid.component.setGrid({ cols: 2 });
		await grid.settle();

		expect(layoutProblems(grid, { collision, cols: 2, rows: 4 })).toEqual([]);
	});
});
