import { describe, expect, test, vi } from 'vitest';

import { FIXED_SIZE, item, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

/** A stub IntersectionObserver whose callback the test fires; returns the live callbacks. */
function stubIntersectionObserver(): { fire: (isIntersecting: boolean) => void; live: () => number } {
	let callbacks: Callback[] = [];
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			private readonly callback: Callback;
			constructor(callback: Callback) {
				this.callback = callback;
				callbacks.push(callback);
			}
			observe() {}
			disconnect() {
				callbacks = callbacks.filter((c) => c !== this.callback);
			}
		}
	);
	return {
		fire: (isIntersecting) => {
			for (const cb of callbacks) cb([{ isIntersecting, boundingClientRect: { width: 400, height: 300 } as DOMRect }]);
		},
		live: () => callbacks.length
	};
}

describe('rendering of off-screen grids', () => {
	test('a grid far off screen skips rendering and keeps its size, and renders again near the viewport', async () => {
		const io = stubIntersectionObserver();
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		expect(grid.gridElement().style.contentVisibility).toBe('');

		io.fire(false);
		await grid.settle();
		expect(grid.gridElement().style.contentVisibility).toBe('auto');
		expect(grid.gridElement().style.getPropertyValue('contain-intrinsic-size')).toBe('auto 400px auto 300px');

		io.fire(true);
		await grid.settle();
		expect(grid.gridElement().style.contentVisibility).toBe('');
	});

	test('without IntersectionObserver a grid always renders normally', async () => {
		// undefined is the stubbed value (a browser without the API), not a default argument.
		// eslint-disable-next-line unicorn/no-useless-undefined
		vi.stubGlobal('IntersectionObserver', undefined);
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		expect(grid.gridElement().style.contentVisibility).toBe('');
	});

	test('a destroyed grid stops observing', async () => {
		const io = stubIntersectionObserver();
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		expect(io.live()).toBe(1);
		grid.unmount();
		expect(io.live()).toBe(0);
	});
});
