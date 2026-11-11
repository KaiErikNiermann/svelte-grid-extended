/**
 * Lifecycle stress: many grids mounted and destroyed quickly, grids and items destroyed
 * mid-gesture, and garbage-collection checks that a destroyed grid is released rather than
 * only removed from the page.
 */
import { describe, expect, test } from 'vitest';
import { tick } from 'svelte';
import { cleanup } from '@testing-library/svelte';

import {
	FIXED_SIZE,
	MODES,
	item,
	layoutProblems,
	mountLayout,
	useLayoutHarness,
	type MountedLayout
} from '../unit/layout-harness';
import {
	RETAINED_AFTER_PRESS,
	canForceGc,
	canMeasureHeap,
	collectGarbage,
	gridsOnPage,
	heapUsed,
	layoutItems,
	report,
	stillReachable,
	trackWindowListeners
} from './stress-utils';

const harness = useLayoutHarness();
// Measured on 2026-11-10 (3 runs): the heap rises 0.2 MiB while the JIT warms up, then the
// last 6 rounds (120 grids) grow 0.1 MiB at most. A 2 KiB-per-grid leak would add 0.23 MiB.
const HEAP_GROWTH_BOUND = 0.2 * 2 ** 20;
const listeners = trackWindowListeners();
const pointerListeners = () => listeners.live('pointermove', 'pointerup');

/** Presses and moves one cell, leaving the pointer down (real input in a browser). */
const pressAndMove = (grid: MountedLayout, selector: string) => grid.hold(selector, 1, 1);

describe('mount and destroy churn', () => {
	test.each(MODES)(
		'50 grids of 20 items, 10 rounds, keep their layouts and leave nothing behind (%s)',
		async (collision) => {
			for (let round = 0; round < 10; round++) {
				const grids = Array.from({ length: 50 }, (_, g) =>
					mountLayout({ grid: { cols: 6, collision, ...FIXED_SIZE }, items: layoutItems(20, round + g) })
				);
				await grids[0]!.settle();
				for (const grid of grids.filter((_, g) => g % 10 === 0)) {
					expect(layoutProblems(grid, { collision, cols: 6, rows: Infinity })).toEqual([]);
				}
				for (const grid of grids) grid.unmount();
				await tick();
			}
			expect(gridsOnPage()).toBe(0);
			expect(harness.liveObservers()).toBe(0);
			expect(pointerListeners()).toBe(0);
		},
		120_000
	);

	test('200 grids mounted and destroyed in the same tick', async () => {
		const grids = Array.from({ length: 200 }, (_, g) =>
			mountLayout({ grid: { cols: 6, collision: MODES[g % 3], ...FIXED_SIZE }, items: layoutItems(8, g) })
		);
		for (const grid of grids) grid.unmount();
		await tick();
		await tick();
		expect(gridsOnPage()).toBe(0);
		expect(harness.liveObservers()).toBe(0);
	});
});

describe('destroyed mid-gesture', () => {
	test.each(MODES)(
		'a grid destroyed during a drag releases its listeners and does not throw (%s)',
		async (collision) => {
			const grid = mountLayout({
				grid: { cols: 4, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0), item('b', 1, 0)]
			});
			await grid.settle();
			const pointer = await pressAndMove(grid, '.it-a');
			expect(pointerListeners()).toBe(2);
			grid.unmount();
			await tick();
			// The pointer keeps moving and is released after the grid is gone.
			await pointer.move(2, 0);
			await pointer.release();
			expect(pointerListeners()).toBe(0);
		}
	);

	test.each(MODES)('an item removed during its own resize releases its listeners (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 4, collision, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 2, 0)]
		});
		await grid.settle();
		const pointer = await pressAndMove(grid, '.it-a .resizer-default');
		grid.component.remove('a');
		await grid.settle();
		await pointer.release();
		expect(pointerListeners()).toBe(0);
		expect(layoutProblems(grid, { collision, cols: 4, rows: Infinity })).toEqual([]);
	});
});

// Each grid lives inside a helper that returns only weak references: a grid held in a local
// of the running test function stays reachable from its stack frame.
async function mountAndDestroy(g: number): Promise<WeakRef<Element>[]> {
	const grid = mountLayout({ grid: { cols: 6, collision: MODES[g % 3], ...FIXED_SIZE }, items: layoutItems(12, g) });
	await grid.settle();
	const refs = [grid.gridElement(), ...grid.container.querySelectorAll('.it')].map((el) => new WeakRef(el));
	grid.unmount();
	return refs;
}

async function destroyMidDrag(collision: (typeof MODES)[number]): Promise<WeakRef<Element>> {
	const grid = mountLayout({ grid: { cols: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
	await grid.settle();
	const ref = new WeakRef(grid.gridElement());
	const pointer = await pressAndMove(grid, '.it-a');
	grid.unmount();
	// The real pointer is still down; release it so the next test starts with it up.
	await pointer.release();
	return ref;
}

/** Heap in use after mounting and destroying 20 grids. */
async function heapAfterRound(): Promise<number> {
	for (let g = 0; g < 20; g++) await mountAndDestroy(g);
	// testing-library keeps a cleanup closure (and its container) per render until cleanup()
	// runs; without this the heap creeps by the harness, not the grid.
	cleanup();
	await collectGarbage();
	return heapUsed()!;
}

// Firefox cannot force a collection from a page, so these run in jsdom and Chromium only;
// see canForceGc in stress-utils.ts for the measurements behind that.
describe.skipIf(!canForceGc)('garbage collection', () => {
	test('destroyed grids and their items are released', async () => {
		const refs: WeakRef<Element>[] = [];
		for (let g = 0; g < 30; g++) refs.push(...(await mountAndDestroy(g)));
		expect(await stillReachable(refs)).toHaveLength(0);
	});

	test('a grid the test keeps reachable is reported as still reachable', async () => {
		// Negative control for stillReachable(): a check that never finds anything looks the
		// same as a clean result.
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const kept = grid.gridElement();
		grid.unmount();
		expect(await stillReachable([new WeakRef(kept)])).toHaveLength(1);
		expect(kept.isConnected).toBe(false);
	});

	test.each(MODES)('grids destroyed mid-drag do not accumulate (%s)', async (collision) => {
		const refs: WeakRef<Element>[] = [];
		for (let g = 0; g < 6; g++) refs.push(await destroyMidDrag(collision));
		// A leak would keep all six; see RETAINED_AFTER_PRESS for the one Chromium keeps.
		const alive = await stillReachable(refs);
		expect(alive.length).toBeLessThanOrEqual(RETAINED_AFTER_PRESS);
	});

	test.skipIf(!canMeasureHeap)(
		'heap use is flat across repeated mount and destroy',
		async () => {
			const samples: number[] = [];
			for (let r = 0; r < 12; r++) samples.push(await heapAfterRound());
			report(`heap MiB per round of 20 grids: ${samples.map((b) => (b / 2 ** 20).toFixed(1)).join(' ')}`);
			expect(samples.at(-1)! - samples.at(-7)!).toBeLessThan(HEAP_GROWTH_BOUND);
		},
		120_000
	);
});
