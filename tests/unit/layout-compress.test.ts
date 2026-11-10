import { expect, test } from 'vitest';

import { FIXED_SIZE, item, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

test.each([
	{ removed: ['a'], expectedY: 2 },
	{ removed: ['a', 'b'], expectedY: 1 },
	{ removed: ['a', 'b', 'c'], expectedY: 0 }
])('removing $removed in one tick leaves the rest compressed', async ({ removed, expectedY }) => {
	// c spans three columns, so it only rises once a and b are both gone, and d sits under c.
	const grid = mountLayout({
		grid: { cols: 4, collision: 'compress', ...FIXED_SIZE },
		items: [item('a', 0, 0), item('b', 1, 0), item('c', 0, 1, 3, 1), item('d', 0, 2, 2, 2)]
	});
	await grid.settle();
	for (const id of removed) grid.component.remove(id);
	await grid.settle();

	expect(grid.component.snapshot().find((i) => i.id === 'd')).toMatchObject({ x: 0, y: expectedY });
});
