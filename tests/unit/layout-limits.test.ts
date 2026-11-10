import { describe, expect, test } from 'vitest';

import { CELL, FIXED_SIZE, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';

const { resizeTo } = useLayoutHarness();
describe('grid limits', () => {
	test('a growing grid keeps its height after the container resize it causes', async () => {
		// The add/remove docs example: items overflowed the container until one was grabbed.
		const grid = mountLayout({
			grid: { cols: 4, collision: 'push', itemSize: { height: CELL } },
			items: [item('a', 0, 0, 2, 2)]
		});
		resizeTo(4 * CELL, 0);
		await grid.settle();
		grid.component.add(item('b', 0, 2, 2, 3));
		await grid.settle();

		const grown = grid.gridElement().style.height;
		expect(Number.parseFloat(grown)).toBeGreaterThanOrEqual(5 * CELL);

		resizeTo(4 * CELL, Number.parseFloat(grown));
		await grid.settle();
		expect(grid.gridElement().style.height).toBe(grown);
	});

	test.each([
		{ collision: 'none', rows: 0 },
		{ collision: 'push', rows: 0 },
		{ collision: 'push', rows: 4 },
		{ collision: 'compress', rows: 4 }
	] as const)('getFirstAvailablePosition works before the first resize ($collision, rows=$rows)', async (props) => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE, ...props }, items: [item('a', 0, 0)] });
		await grid.settle();
		expect(grid.component.getController()!.getFirstAvailablePosition(1, 1)).toEqual({ x: 1, y: 0 });
	});

	test.each(['push', 'compress'] as const)('%s mode ignores rows, as documented, when pushing', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 2, rows: 1, collision, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 1, 0)]
		});
		resizeTo(2 * CELL, CELL);
		await grid.settle();
		await grid.resize('a', 1, 0);

		expect(grid.component.snapshot().find((i) => i.id === 'a')).toMatchObject({ w: 2, h: 1 });
		expect(layoutProblems(grid, { collision, cols: 2, rows: Infinity })).toEqual([]);
	});
});
