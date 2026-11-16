import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, MODES, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';
import type { LayoutSpec } from './layout-harness';

useLayoutHarness();

const preferred = (id: string, x: number, y: number, w = 1, h = 1): LayoutSpec => ({
	...item(id, x, y, w, h),
	placement: 'preferred'
});

const at = (grid: ReturnType<typeof mountLayout>, id: string) => grid.component.snapshot().find((i) => i.id === id);

describe("placement: 'preferred' in none mode", () => {
	test('keeps a saved position that is free', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add(preferred('b', 2, 1));
		await grid.settle();

		expect(at(grid, 'b')).toMatchObject({ x: 2, y: 1 });
	});

	test('moves an item revealed on an occupied cell to free space, leaving the others', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0, 2, 1)] });
		await grid.settle();
		grid.component.add(preferred('b', 1, 0));
		await grid.settle();

		expect(at(grid, 'a')).toMatchObject({ x: 0, y: 0, w: 2, h: 1 });
		expect(at(grid, 'b')).toMatchObject({ x: 2, y: 0 });
		expect(layoutProblems(grid, { collision: 'none', cols: 4, rows: Infinity })).toEqual([]);
	});

	test('gives a group revealed in one tick a cell each', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		// All three saved on the same occupied cell, added in one change.
		grid.component.add(preferred('b', 0, 0), preferred('c', 0, 0), preferred('d', 0, 0));
		await grid.settle();

		expect(at(grid, 'a')).toMatchObject({ x: 0, y: 0 });
		expect(layoutProblems(grid, { collision: 'none', cols: 4, rows: Infinity })).toEqual([]);
	});

	test('gives a free saved cell to its own item before a moved one can take it', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0, 2, 1)] });
		await grid.settle();
		// g1's cell is under a; g2's cell, (2,0), is free, and it is both the first free cell in
		// reading order and the free cell nearest g1's. Placed one by one, g1 took (2,0) and g2
		// ended up at (3,0).
		grid.component.add(preferred('g1', 1, 0), preferred('g2', 2, 0));
		await grid.settle();

		expect(at(grid, 'g2')).toMatchObject({ x: 2, y: 0 });
		expect(layoutProblems(grid, { collision: 'none', cols: 4, rows: Infinity })).toEqual([]);
	});

	test('moves a blocked item to the free cell nearest its saved one, not the first in reading order', async () => {
		const grid = mountLayout({ grid: { cols: 8, ...FIXED_SIZE }, items: [item('a', 0, 0, 2, 2)] });
		await grid.settle();
		// The first free cell in reading order is (2,0); the nearest to (0,1) is (0,2).
		grid.component.add(preferred('b', 0, 1));
		await grid.settle();

		expect(at(grid, 'b')).toMatchObject({ x: 0, y: 2 });
	});

	test('skips an item removed in the same tick it was added', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add(preferred('b', 0, 0), preferred('c', 0, 0));
		grid.component.remove('b');
		await grid.settle();

		expect(grid.component.snapshot().map((i) => i.id)).toEqual(['a', 'c']);
		expect(layoutProblems(grid, { collision: 'none', cols: 4, rows: Infinity })).toEqual([]);
	});

	test('in a full fixed-size grid leaves the item overlapping until a cell frees up', async () => {
		const grid = mountLayout({
			grid: { cols: 2, rows: 1, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 1, 0)]
		});
		await grid.settle();
		grid.component.add(preferred('c', 0, 0));
		await grid.settle();
		expect(at(grid, 'c')).toMatchObject({ x: 0, y: 0 });

		grid.component.remove('b');
		await grid.settle();
		expect(at(grid, 'c')).toMatchObject({ x: 1, y: 0 });
	});

	test('does not apply to later prop changes, which none mode takes as given', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0), preferred('b', 2, 0)] });
		await grid.settle();
		grid.component.patch('b', { x: 0 });
		await grid.settle();

		expect(at(grid, 'b')).toMatchObject({ x: 0, y: 0 });
	});

	test("the default 'exact' still overlaps, as before", async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add(item('b', 0, 0));
		await grid.settle();

		expect(at(grid, 'b')).toMatchObject({ x: 0, y: 0 });
	});
});

describe("placement: 'preferred' in every mode", () => {
	test.each(MODES)('leaves no overlap after a reveal on an occupied cell (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		grid.component.add(preferred('b', 0, 0), preferred('c', 0, 0));
		await grid.settle();

		expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
	});
});
