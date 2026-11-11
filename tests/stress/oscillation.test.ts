/**
 * Erratic and oscillating state changes under different timings: the same item spawned and
 * despawned over and over, props flipping between colliding and free positions, cols and
 * collision mode switching back and forth, the whole grid toggled, and items oscillating
 * under an active drag. After each burst the grid's registry, the DOM and the bound values
 * must agree and the layout must be valid.
 */
import { describe, expect, test } from 'vitest';
import { tick } from 'svelte';

import {
	FIXED_SIZE,
	MODES,
	item,
	layoutProblems,
	mountLayout,
	useLayoutHarness,
	type MountedLayout
} from '../unit/layout-harness';
import type { Collision } from '../../src/lib/types';
import { trackWindowListeners } from './stress-utils';

const harness = useLayoutHarness();
const listeners = trackWindowListeners();

/** How long to wait between two changes: from not at all to everything settled. */
const TIMINGS: Record<string, (grid: MountedLayout) => Promise<void>> = {
	'same tick': async () => {},
	microtask: () => Promise.resolve(),
	macrotask: () => new Promise((resolve) => setTimeout(resolve, 0)),
	settled: (grid) => grid.settle()
};
const timingNames = Object.keys(TIMINGS);
const cases = MODES.flatMap((collision) => timingNames.map((timing) => ({ collision, timing })));

const ids = (list: string[]) => [...list].sort().join(',');

/** The registry, the DOM and the bindings name the same items at the same places. */
function coherenceProblems(grid: MountedLayout): string[] {
	const registry = grid.component.getController()?.gridParams.items ?? {};
	const bound = grid.component.snapshot();
	const drawn = grid.drawn();
	const problems: string[] = [];
	if (ids(Object.keys(registry)) !== ids(bound.map((i) => i.id))) {
		problems.push(`registry has [${ids(Object.keys(registry))}] but the page binds [${ids(bound.map((i) => i.id))}]`);
	}
	if (ids(Object.keys(drawn)) !== ids(bound.map((i) => i.id))) {
		problems.push(`DOM has [${ids(Object.keys(drawn))}] but the page binds [${ids(bound.map((i) => i.id))}]`);
	}
	for (const it of bound) {
		const r = registry[it.id];
		if (r && (r.x !== it.x || r.y !== it.y || r.w !== it.w || r.h !== it.h)) {
			problems.push(
				`${it.id} is at (${r.x},${r.y} ${r.w}x${r.h}) in the registry but bound (${it.x},${it.y} ${it.w}x${it.h})`
			);
		}
	}
	return problems;
}

function allProblems(grid: MountedLayout, collision: Collision, cols: number): string[] {
	return [...coherenceProblems(grid), ...layoutProblems(grid, { collision, cols, rows: Infinity })];
}

describe('spawn, despawn, spawn', () => {
	test.each(cases)(
		'the same id toggled 101 times stays registered once ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({
				grid: { cols: 4, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0), item('c', 1, 0)]
			});
			await grid.settle();
			for (let i = 0; i < 101; i++) {
				if (i % 2 === 0) grid.component.add(item('b', 2, 0));
				else grid.component.remove('b');
				await TIMINGS[timing]!(grid);
			}
			await grid.settle();
			expect(grid.container.querySelectorAll('.it-b')).toHaveLength(1);
			expect(allProblems(grid, collision, 4)).toEqual([]);
		}
	);

	test.each(cases)(
		'an unplaced item toggled 101 times lands on a free cell ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({
				grid: { cols: 4, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0), item('c', 1, 0)]
			});
			await grid.settle();
			for (let i = 0; i < 101; i++) {
				if (i % 2 === 0) grid.component.add({ id: 'b', w: 2, h: 1 });
				else grid.component.remove('b');
				await TIMINGS[timing]!(grid);
			}
			await grid.settle();
			expect(allProblems(grid, collision, 4)).toEqual([]);
		}
	);

	test.each(cases)(
		'40 items added and removed in waves stay coherent ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({ grid: { cols: 6, collision, ...FIXED_SIZE }, items: [] });
			await grid.settle();
			for (let wave = 0; wave < 10; wave++) {
				for (let i = 0; i < 40; i++) grid.component.add({ id: `w${wave}-${i}`, w: 1 + (i % 2), h: 1 });
				await TIMINGS[timing]!(grid);
				for (let i = 0; i < 40; i += 2) grid.component.remove(`w${wave}-${i}`);
				await TIMINGS[timing]!(grid);
			}
			await grid.settle();
			expect(grid.component.snapshot()).toHaveLength(200);
			expect(allProblems(grid, collision, 6)).toEqual([]);
		},
		60_000
	);
});

describe('oscillating props', () => {
	test.each(cases.filter((c) => c.collision !== 'none'))(
		'x flipping onto another item and back 100 times ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({
				grid: { cols: 4, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0), item('b', 2, 0)]
			});
			await grid.settle();
			for (let i = 0; i < 100; i++) {
				grid.component.patch('b', { x: i % 2 === 0 ? 0 : 2, y: 0 });
				await TIMINGS[timing]!(grid);
			}
			await grid.settle();
			expect(allProblems(grid, collision, 4)).toEqual([]);
		}
	);

	test.each(cases.filter((c) => c.collision !== 'none'))(
		'w growing over a neighbour and shrinking 100 times ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({
				grid: { cols: 4, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0), item('b', 1, 0)]
			});
			await grid.settle();
			for (let i = 0; i < 100; i++) {
				grid.component.patch('a', { w: i % 2 === 0 ? 3 : 1 });
				await TIMINGS[timing]!(grid);
			}
			await grid.settle();
			expect(allProblems(grid, collision, 4)).toEqual([]);
		}
	);

	test.each(cases)(
		'cols flipping between 6 and 2 for 50 rounds ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({
				grid: { cols: 6, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0, 2, 1), item('b', 2, 0, 2, 1), item('c', 4, 0, 2, 1), item('d', 5, 1), item('e', 0, 1)]
			});
			await grid.settle();
			for (let i = 0; i < 50; i++) {
				grid.component.setGrid({ cols: i % 2 === 0 ? 2 : 6 });
				await TIMINGS[timing]!(grid);
			}
			await grid.settle();
			expect(allProblems(grid, collision, 6)).toEqual([]);
		}
	);

	test.each(timingNames)('collision mode cycling none, push, compress 30 times (%s)', async (timing) => {
		const grid = mountLayout({
			grid: { cols: 4, collision: 'none', ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 1, 2), item('c', 3, 4, 1, 2)]
		});
		await grid.settle();
		for (let i = 0; i < 30; i++) {
			grid.component.setGrid({ collision: MODES[i % 3] });
			await TIMINGS[timing]!(grid);
		}
		await grid.settle();
		// 30 steps end on compress (index 29 % 3 = 2).
		expect(allProblems(grid, 'compress', 4)).toEqual([]);
	});
});

describe('the whole grid toggled', () => {
	test.each(cases)(
		'mounted and destroyed 102 times, ending mounted ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({
				grid: { cols: 4, collision, ...FIXED_SIZE },
				items: [item('a', 0, 0), item('b', 1, 0), { id: 'c', w: 2, h: 1 }]
			});
			await grid.settle();
			for (let i = 0; i < 102; i++) {
				grid.component.setVisible(i % 2 === 1);
				await TIMINGS[timing]!(grid);
			}
			await grid.settle();
			expect(harness.liveObservers()).toBe(1);
			expect(allProblems(grid, collision, 4)).toEqual([]);
			grid.component.setVisible(false);
			await grid.settle();
			expect(harness.liveObservers()).toBe(0);
			expect(listeners.live('pointermove', 'pointerup')).toBe(0);
		}
	);
});

describe('changes under an active drag', () => {
	test.each(cases.filter((c) => c.collision !== 'none'))(
		'an item toggled 21 times at the drag destination ($collision, $timing)',
		async ({ collision, timing }) => {
			const grid = mountLayout({ grid: { cols: 4, collision, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
			await grid.settle();
			await grid.drag('a', 2, 0, async () => {
				for (let i = 0; i < 21; i++) {
					if (i % 2 === 0) grid.component.add(item('b', 2, 0));
					else grid.component.remove('b');
					await TIMINGS[timing]!(grid);
				}
				await tick();
			});
			expect(listeners.live('pointermove', 'pointerup')).toBe(0);
			expect(allProblems(grid, collision, 4)).toEqual([]);
		}
	);

	test.each(MODES)('readOnly switched on mid-drag ends the drag cleanly (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 4, collision, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 3, 3)]
		});
		await grid.settle();
		await grid.drag('a', 2, 0, async () => {
			grid.component.setGrid({ readOnly: true });
			await grid.settle();
		});
		expect(listeners.live('pointermove', 'pointerup')).toBe(0);
		expect(allProblems(grid, collision, 4)).toEqual([]);
	});
});
