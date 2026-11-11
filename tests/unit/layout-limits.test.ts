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

describe('a drag preview below the last row', () => {
	test.each(['none', 'shift'] as const)('grows the grid before the drop (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const oneRow = grid.gridElement().style.height;
		let during = '';
		await grid.dragSteps('a', [
			[0, 3],
			() => {
				during = grid.gridElement().style.height;
			}
		]);

		// containerHeight is $rows \cdot (height + gap + 1)$: 4 rows of 100px cells, gap 0.
		expect(oneRow).toBe('101px');
		expect(during).toBe('404px');
		expect(grid.gridElement().style.height).toBe('404px');
	});

	test('shrinks back when the drag is cancelled', async () => {
		const grid = mountLayout({ grid: { cols: 4, collision: 'shift', ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		await grid.dragSteps('a', [
			[0, 3],
			() => {
				window.dispatchEvent(new MouseEvent('pointercancel', { bubbles: true }));
			}
		]);

		expect(grid.gridElement().style.height).toBe('101px');
	});
});

describe('a grid with fixed cols and rows and a given cell size', () => {
	test('takes its size from the cells, not from its container', async () => {
		const grid = mountLayout({ grid: { cols: 4, rows: 2, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();

		// $n \cdot (\text{cell} + gap + 1)$ with 100px cells and gap 0, as for a growing grid.
		expect(grid.gridElement().style.width).toBe('404px');
		expect(grid.gridElement().style.height).toBe('202px');
	});

	test('with only a height given, fills the container width and takes its height from the rows', async () => {
		const grid = mountLayout({ grid: { cols: 4, rows: 2, itemSize: { height: CELL } }, items: [item('a', 0, 0)] });
		await grid.settle();

		expect(grid.gridElement().style.width).toBe('100%');
		expect(grid.gridElement().style.height).toBe('202px');
	});
});
