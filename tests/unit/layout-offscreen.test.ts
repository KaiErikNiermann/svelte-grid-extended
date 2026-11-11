import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, IN_JSDOM, item, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

const visibility = (grid: ReturnType<typeof mountLayout>) => grid.gridElement().style.contentVisibility;

describe('rendering of grids away from the viewport', () => {
	test('a grid lets the browser skip it while it is away from the viewport', async () => {
		const grid = mountLayout({ grid: { cols: 4, skipOffscreen: true, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();

		expect(visibility(grid)).toBe('auto');
		expect(grid.gridElement().getAttribute('style')).toContain('contain-intrinsic-size: auto none');
	});

	test('a drag turns skipping off, so the dragged item is not clipped, and the drop turns it on', async () => {
		const grid = mountLayout({ grid: { cols: 4, skipOffscreen: true, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const pointer = await grid.hold('.it-a', 1, 0);
		expect(visibility(grid)).toBe('');

		await pointer.release();
		expect(visibility(grid)).toBe('auto');
	});

	test('a resize turns skipping off until it ends', async () => {
		const grid = mountLayout({ grid: { cols: 4, skipOffscreen: true, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const pointer = await grid.hold('.it-a .resizer-default', 1, 0);
		expect(visibility(grid)).toBe('');

		await pointer.release();
		expect(visibility(grid)).toBe('auto');
	});

	// In a real engine: skipping must never leave an on-screen grid undrawn once a frame has run.
	test.skipIf(IN_JSDOM)('an on-screen grid with skipping on is drawn after a frame', async () => {
		const grid = mountLayout({
			grid: { cols: 4, skipOffscreen: true, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 1, 0, 2, 1)]
		});
		await grid.settle();
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const sizes = [...grid.container.querySelectorAll<HTMLElement>('.it')].map((el) => {
			const r = el.getBoundingClientRect();
			return [Math.round(r.width), Math.round(r.height)];
		});
		expect(sizes).toEqual([
			[100, 100],
			[200, 100]
		]);
	});

	test('skipOffscreen={false} keeps every grid rendered', async () => {
		const grid = mountLayout({ grid: { cols: 4, skipOffscreen: false, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();

		expect(visibility(grid)).toBe('');
	});
});
