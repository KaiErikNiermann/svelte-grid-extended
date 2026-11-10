import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();
describe('prop changes onto another item', () => {
	test.each(['push', 'compress'] as const)('push the other item away (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 4, collision, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 2, 0)]
		});
		await grid.settle();
		grid.component.patch('b', { x: 0 });
		await grid.settle();

		expect(grid.component.snapshot().find((i) => i.id === 'b')).toMatchObject({ x: 0, y: 0 });
		expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
	});

	test.each(['push', 'compress'] as const)('a growing w pushes the item it covers (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 4, collision, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 2, 0)]
		});
		await grid.settle();
		grid.component.patch('a', { w: 3 });
		await grid.settle();

		expect(grid.component.snapshot().find((i) => i.id === 'a')).toMatchObject({ x: 0, y: 0, w: 3 });
		expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
	});

	test('are applied as given in none mode, which allows overlap', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0), item('b', 2, 0)] });
		await grid.settle();
		grid.component.patch('b', { x: 0 });
		await grid.settle();

		expect(grid.component.snapshot()).toEqual([item('a', 0, 0), item('b', 0, 0)]);
	});

	test.each(['push', 'compress'] as const)(
		'made during a drag leave no overlap after the drop (%s)',
		async (collision) => {
			const grid = mountLayout({
				grid: { cols: 4, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0), item('b', 3, 3)]
			});
			await grid.settle();
			await grid.drag('a', 2, 0, async () => {
				grid.component.patch('b', { x: 2, y: 0 });
				await grid.settle();
			});

			expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
		}
	);
});
