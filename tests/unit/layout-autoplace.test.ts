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
