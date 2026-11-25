/**
 * The drag threshold: a press on an item starts its drag only once the pointer has moved further
 * than the grid's `dragThreshold`, so a press and release on the item, or on a header inside
 * it, stays a click. A drag that did start ends without a click.
 *
 * Clicks are checked in browsers only: jsdom fires no click after synthetic pointer events, so
 * there the tests check only when the gesture starts.
 */
import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, IN_JSDOM, item, mountLayout, useLayoutHarness, type MountedLayout } from './layout-harness';

useLayoutHarness();

/** In pixels; the harness cells are 100px, so a move of 0.05 cells stays under it. */
const THRESHOLD = 10;

const active = (grid: MountedLayout, id: string) =>
	!!grid.container.querySelector(`.it-${id}`)?.classList.contains('active-default');

/**
 * Counts clicks on item `id`'s header and on the item itself. Once a drag has captured the
 * pointer, the browser sends the click to the item rather than to the header, so a handler on
 * the item would see it.
 */
function countClicks(grid: MountedLayout, id: string): { header: () => number; item: () => number } {
	const counts = { header: 0, item: 0 };
	grid.container.querySelector(`.hd-${id}`)!.addEventListener('click', () => counts.header++);
	grid.container.querySelector(`.it-${id}`)!.addEventListener('click', () => counts.item++);
	return { header: () => counts.header, item: () => counts.item };
}

describe('drag threshold', () => {
	test('a press that has not moved past the threshold shows no drag', async () => {
		const grid = mountLayout({
			grid: { cols: 4, dragThreshold: THRESHOLD, ...FIXED_SIZE },
			items: [item('a', 0, 0)]
		});
		await grid.settle();
		const held = await grid.hold('.it-a', 0.05, 0);
		expect(active(grid, 'a')).toBe(false);
		expect(grid.preview()).toBeUndefined();
		await held.release();

		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 1, h: 1 });
	});

	test('the drag starts once the pointer passes the threshold', async () => {
		const grid = mountLayout({
			grid: { cols: 4, dragThreshold: THRESHOLD, ...FIXED_SIZE },
			items: [item('a', 0, 0)]
		});
		await grid.settle();
		const held = await grid.hold('.it-a', 0.05, 0);
		await held.move(0.2, 0);
		expect(active(grid, 'a')).toBe(true);
		await held.move(1, 1);
		await held.release();

		expect(grid.drawn().a).toEqual({ x: 1, y: 1, w: 1, h: 1 });
	});

	// Measured from where the threshold was passed, a 0.6-cell drag would only be 0.15 cells.
	test('the item follows the pointer from where it was pressed, not from the threshold', async () => {
		const grid = mountLayout({ grid: { cols: 4, dragThreshold: 45, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		await grid.dragPath('a', [
			[0.46, 0],
			[0.6, 0]
		]);

		expect(grid.drawn().a).toEqual({ x: 1, y: 0, w: 1, h: 1 });
	});

	test('the resize handle waits for the threshold too', async () => {
		const grid = mountLayout({
			grid: { cols: 4, dragThreshold: THRESHOLD, ...FIXED_SIZE },
			items: [item('a', 0, 0)]
		});
		await grid.settle();
		const held = await grid.hold('.it-a .resizer-default', 0.05, 0.05);
		expect(grid.preview()).toBeUndefined();
		await held.move(1, 1);
		expect(grid.preview()).toBeDefined();
		await held.release();

		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 2, h: 2 });
	});

	test('with dragThreshold 0 the drag starts at the press', async () => {
		const grid = mountLayout({ grid: { cols: 4, dragThreshold: 0, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const held = await grid.hold('.it-a', 0, 0);
		expect(active(grid, 'a')).toBe(true);
		await held.release();
	});

	test('by default a press that does not move shows no drag', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const held = await grid.hold('.it-a', 0, 0);
		expect(active(grid, 'a')).toBe(false);
		await held.release();
	});
});

describe.skipIf(IN_JSDOM)('clicks on a draggable header', () => {
	test('a press and release on the header is a click and moves nothing', async () => {
		const grid = mountLayout({
			grid: { cols: 4, dragThreshold: THRESHOLD, ...FIXED_SIZE },
			items: [{ ...item('a', 0, 0), header: true }]
		});
		await grid.settle();
		const clicks = countClicks(grid, 'a');
		const held = await grid.hold('.it-a .hd-a', 0.05, 0);
		await held.release();

		expect(clicks.header()).toBe(1);
		expect(active(grid, 'a')).toBe(false);
		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 1, h: 1 });
	});

	test('the click after a drag is the only one swallowed', async () => {
		const grid = mountLayout({
			grid: { cols: 4, dragThreshold: THRESHOLD, ...FIXED_SIZE },
			items: [{ ...item('a', 0, 0), header: true }]
		});
		await grid.settle();
		const clicks = countClicks(grid, 'a');
		await grid.dragPath('a', [[1, 0]]);
		const held = await grid.hold('.it-a .hd-a', 0, 0);
		await held.release();

		expect(grid.drawn().a).toEqual({ x: 1, y: 0, w: 1, h: 1 });
		expect(clicks.header()).toBe(1);
	});
});
