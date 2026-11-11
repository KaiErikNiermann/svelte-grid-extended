/**
 * A grid that moves on screen during a drag or resize: content above it grows, the page scrolls.
 * The item must stay under the pointer, which means it is placed from where the pointer is
 * relative to the grid now, not from how far the pointer moved on the page.
 *
 * Browsers only: jsdom has no layout, so every element sits at (0, 0) and nothing can move.
 */
import { describe, expect, test } from 'vitest';

import { CELL, FIXED_SIZE, IN_JSDOM, item, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

/** Resolves on the next scroll anywhere in the page, after the grid's own scroll handling. */
function nextScroll(): Promise<void> {
	return new Promise((resolve) => window.addEventListener('scroll', () => resolve(), { once: true, capture: true }));
}

describe.skipIf(IN_JSDOM)('a grid that moves during a gesture', () => {
	test('content growing above the grid mid-drag leaves the item under the pointer', async () => {
		const grid = mountLayout({ grid: { cols: 4, rows: 4, ...FIXED_SIZE }, items: [item('a', 0, 2)] });
		await grid.settle();
		await grid.dragSteps('a', [
			[1, 0],
			() => {
				// The grid moves two rows down; the pointer stays where it is on screen.
				grid.container.style.paddingTop = `${2 * CELL}px`;
			},
			[2, 0]
		]);

		// The pointer is now over row 0 of the grid, so that is where a goes.
		expect(grid.drawn().a).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	// A scroll container, not the page: page coordinates already include the page's own scroll,
	// so only an inner scroller tells measuring from the grid apart from measuring on the page.
	test('a scroll container scrolled mid-drag places the item under the still pointer', async () => {
		const grid = mountLayout({ grid: { cols: 4, rows: 6, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		Object.assign(grid.container.style, { overflow: 'auto', blockSize: `${4 * CELL}px` });
		const tail = document.createElement('div');
		tail.style.blockSize = '3000px';
		grid.container.append(tail);
		await grid.settle();
		await grid.dragSteps('a', [
			[1, 0],
			async () => {
				const scrolled = nextScroll();
				grid.container.scrollBy(0, 2 * CELL);
				await scrolled;
				await grid.settle();
			}
		]);

		// The pointer did not move: the browser's own pointermove after a scroll keeps the same page
		// position, which measured on the page moved nothing. Over the grid it is two rows lower.
		expect(grid.drawn().a).toEqual({ x: 1, y: 2, w: 1, h: 1 });
	});

	test('content growing above the grid mid-resize resizes to the pointer', async () => {
		const grid = mountLayout({ grid: { cols: 4, rows: 4, ...FIXED_SIZE }, items: [item('a', 0, 0, 1, 3)] });
		await grid.settle();
		const pointer = await grid.hold('.it-a .resizer-default', 1, 0);
		grid.container.style.paddingTop = `${CELL}px`;
		await grid.settle();
		// A small move after the grid moved: pointermove only fires when the pointer moves.
		await pointer.move(1, 0.05);
		await pointer.release();

		// The pointer is now almost a row higher over the grid than at the press: a ends a row shorter.
		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 2, h: 2 });
	});

	test('bounds keep an item inside a grid that is not at the corner of the page', async () => {
		const grid = mountLayout({ grid: { cols: 6, rows: 2, bounds: true, ...FIXED_SIZE }, items: [item('a', 3, 0)] });
		grid.container.style.paddingLeft = `${3 * CELL}px`;
		await grid.settle();
		await grid.drag('a', -3, 0);

		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 1, h: 1 });
	});
});
