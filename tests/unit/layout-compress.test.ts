import { describe, expect, test } from 'vitest';

import { GridController } from '../../src/lib/GridController';

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

/** Counts _internalCompress calls while `run` executes. */
async function countPasses(run: () => Promise<void>): Promise<number> {
	let passes = 0;
	const original = GridController.prototype._internalCompress;
	GridController.prototype._internalCompress = function (this: GridController, ...args) {
		passes++;
		return original.apply(this, args);
	};
	try {
		await run();
	} finally {
		GridController.prototype._internalCompress = original;
	}
	return passes;
}

const spread = (n: number) => Array.from({ length: n }, (_, i) => item(`i${i}`, i % 4, 2 * i));

describe('compress passes', () => {
	// One pass per microtask, plus one to confirm it moved nothing further. Compressing on
	// every change took 2n - 1 passes for n items (159 for 80).
	test('mounting 80 spread-out items compresses in at most 2 passes', async () => {
		let grid: ReturnType<typeof mountLayout> | undefined;
		const passes = await countPasses(async () => {
			grid = mountLayout({ grid: { cols: 4, collision: 'compress', ...FIXED_SIZE }, items: spread(80) });
			await grid.settle();
		});
		expect(passes).toBeLessThanOrEqual(2);
		expect(Math.max(...grid!.component.snapshot().map((i) => i.y!))).toBeLessThan(20);
	});

	test('destroying a compress grid runs no compress pass', async () => {
		const grid = mountLayout({ grid: { cols: 4, collision: 'compress', ...FIXED_SIZE }, items: spread(40) });
		await grid.settle();
		const passes = await countPasses(async () => {
			grid.unmount();
			await grid.settle();
		});
		expect(passes).toBe(0);
	});
});
