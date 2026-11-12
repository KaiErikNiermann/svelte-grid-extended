/**
 * In `none` mode a drag or resize never takes an occupied cell. When the app puts an item under
 * the outline while the pointer is held (placement cases P2 and P4), the outline steps back to
 * the last free box it passed and the drop lands there; the new item stays where the app put it.
 */
import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

async function noneGrid(items: ReturnType<typeof item>[]) {
	const grid = mountLayout({ grid: { cols: 4, rows: 4, collision: 'none', ...FIXED_SIZE }, items });
	await grid.settle();
	return grid;
}

function at(grid: Awaited<ReturnType<typeof noneGrid>>, id: string) {
	const found = grid.component.snapshot().find((i) => i.id === id);
	return found && { x: found.x, y: found.y, w: found.w, h: found.h };
}

describe('none mode: the layout wins over a held gesture', () => {
	test('P2: an item added under the outline sends the drag back to the last free cell it passed', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		const pointer = await grid.hold('.it-a', 1, 0);
		await pointer.move(2, 0);
		expect(grid.preview()).toEqual({ x: 2, y: 0, w: 1, h: 1 });

		grid.component.add(item('n', 2, 0));
		await grid.settle();
		// The outline moves off n before the release, so what it shows is what the drop does.
		expect(grid.preview()).toEqual({ x: 1, y: 0, w: 1, h: 1 });

		await pointer.release();
		expect(at(grid, 'a')).toEqual({ x: 1, y: 0, w: 1, h: 1 });
		expect(at(grid, 'n')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
		expect(layoutProblems(grid, { collision: 'none', cols: 4, rows: 4 })).toEqual([]);
	});

	test('P2 with no free cell on the way: the item stays where it was', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		const pointer = await grid.hold('.it-a', 2, 0);
		grid.component.add(item('n', 2, 0));
		await grid.settle();
		expect(grid.preview()).toEqual({ x: 0, y: 0, w: 1, h: 1 });

		await pointer.release();
		expect(at(grid, 'a')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
		expect(at(grid, 'n')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	test('P4: an item moved under the outline by its props keeps its new place', async () => {
		const grid = await noneGrid([item('a', 0, 0), item('b', 3, 3)]);
		const pointer = await grid.hold('.it-a', 1, 0);
		await pointer.move(2, 0);
		grid.component.patch('b', { x: 2, y: 0 });
		await grid.settle();

		await pointer.release();
		expect(at(grid, 'a')).toEqual({ x: 1, y: 0, w: 1, h: 1 });
		expect(at(grid, 'b')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	test('after stepping back, the drag still refuses the taken cell and takes free ones', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		const pointer = await grid.hold('.it-a', 1, 0);
		await pointer.move(2, 0);
		grid.component.add(item('n', 2, 0));
		await grid.settle();
		await pointer.move(2, 0.05);
		expect(grid.preview()).toEqual({ x: 1, y: 0, w: 1, h: 1 });
		await pointer.move(2, 1);
		expect(grid.preview()).toEqual({ x: 2, y: 1, w: 1, h: 1 });

		await pointer.release();
		expect(at(grid, 'a')).toEqual({ x: 2, y: 1, w: 1, h: 1 });
	});

	test('a resize shrinks back to the last free size when an item appears in its way', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		const pointer = await grid.hold('.it-a .resizer-default', 1, 0);
		await pointer.move(2, 0);
		expect(grid.preview()).toEqual({ x: 0, y: 0, w: 3, h: 1 });

		grid.component.add(item('n', 2, 0));
		await grid.settle();
		expect(grid.preview()).toEqual({ x: 0, y: 0, w: 2, h: 1 });

		await pointer.release();
		expect(at(grid, 'a')).toEqual({ x: 0, y: 0, w: 2, h: 1 });
		expect(at(grid, 'n')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	test('overlaps the app sets with props are still kept', async () => {
		const grid = await noneGrid([item('a', 0, 0), item('b', 2, 0)]);
		grid.component.patch('b', { x: 0, y: 0 });
		await grid.settle();
		expect(at(grid, 'b')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
	});
});
