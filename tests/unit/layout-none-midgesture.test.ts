/**
 * In `none` mode a drag or resize never takes an occupied cell. When the app puts an item under
 * the outline while the pointer is held (placement cases P2 and P4), the outline steps back to
 * the last free box it passed and the drop lands there; the new item stays where the app put it.
 */
import { describe, expect, inject, test } from 'vitest';
import fc from 'fast-check';

import {
	type DragStep,
	FIXED_SIZE,
	IN_JSDOM,
	item,
	layoutProblems,
	mountLayout,
	useLayoutHarness
} from './layout-harness';

useLayoutHarness();

async function noneGrid(items: ReturnType<typeof item>[]) {
	const grid = mountLayout({ grid: { cols: 4, rows: 4, collision: 'none', ...FIXED_SIZE }, items });
	await grid.settle();
	return grid;
}

/** An item's box, or undefined when it is missing or not placed. */
function at(grid: Awaited<ReturnType<typeof noneGrid>>, id: string) {
	const found = grid.component.snapshot().find((i) => i.id === id);
	if (found?.x === undefined || found.y === undefined) return;
	return { x: found.x, y: found.y, w: found.w, h: found.h };
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

type Grid = Awaited<ReturnType<typeof noneGrid>>;

const overlapping = (p: { x: number; y: number; w: number; h: number }, q: typeof p) =>
	p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;

/** Adds an item on the cell the outline shows right now, as a page reacting to it would. */
function spawnOnOutline(grid: Grid, id: string): void {
	const outline = grid.preview();
	if (outline) grid.component.add(item(id, Math.round(outline.x), Math.round(outline.y)));
}

describe('none mode: timing of changes during a held drag', () => {
	test('spawned under the outline, then removed: the drop lands on a free cell', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		await grid.dragSteps('a', [
			[1, 0],
			[2, 0],
			() => grid.component.add(item('n', 2, 0)),
			() => grid.settle(),
			() => grid.component.remove('n'),
			() => grid.settle()
		]);
		// jsdom sends no further move, so the outline stays where it stepped back to. A browser
		// fires its own pointermove when the content under the pointer changes, and the outline
		// takes the freed cell again. Either way nothing is under the drop.
		expect(at(grid, 'a')).toEqual(IN_JSDOM ? { x: 1, y: 0, w: 1, h: 1 } : { x: 2, y: 0, w: 1, h: 1 });
	});

	test('spawned and removed in the same tick: nothing was ever in the way', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		await grid.dragSteps('a', [
			[1, 0],
			[2, 0],
			() => {
				grid.component.add(item('n', 2, 0));
				grid.component.remove('n');
			},
			() => grid.settle()
		]);
		expect(at(grid, 'a')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	test('spawned just before the move onto its cell: the move refuses the cell', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		await grid.dragSteps(
			'a',
			[[1, 0], () => grid.settle(), () => grid.component.add(item('n', 2, 0)), [2, 0], () => grid.settle()],
			{ fast: true }
		);
		expect(at(grid, 'a')).toEqual({ x: 1, y: 0, w: 1, h: 1 });
		expect(at(grid, 'n')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	test('spawned on each cell the outline steps back to, it ends at the start: the item stays', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		await grid.dragSteps('a', [
			[1, 0],
			[2, 0],
			() => spawnOnOutline(grid, 'n1'),
			() => grid.settle(),
			() => spawnOnOutline(grid, 'n2'),
			() => grid.settle()
		]);
		expect(at(grid, 'n1')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
		expect(at(grid, 'n2')).toEqual({ x: 1, y: 0, w: 1, h: 1 });
		expect(at(grid, 'a')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
	});

	test('spawned and removed over and over: the drop never lands on an item', async () => {
		const grid = await noneGrid([item('a', 0, 0)]);
		const steps: DragStep[] = [[1, 0]];
		for (let round = 0; round < 5; round++) {
			steps.push(
				[2, round % 2],
				() => spawnOnOutline(grid, `n${round}`),
				() => grid.settle()
			);
			if (round < 4)
				steps.push(
					() => grid.component.remove(`n${round}`),
					() => grid.settle()
				);
		}
		await grid.dragSteps('a', steps);
		const a = at(grid, 'a')!;
		for (const other of grid.component.snapshot().filter((i) => i.id !== 'a')) {
			expect(overlapping(a, at(grid, other.id)!), `a ${JSON.stringify(a)} on ${other.id}`).toBe(false);
		}
	});

	test('spawned in the same tick as the release: the drop lands first, and the new item overlaps it', async () => {
		// Not something the grid can tell from the app placing an item on a after the drop: it
		// registers after the drop and is applied as given, like any overlap set by the app (P1).
		const grid = await noneGrid([item('a', 0, 0)]);
		const pointer = await grid.hold('.it-a', 1, 0);
		await pointer.move(2, 0);
		grid.component.add(item('n', 2, 0));
		await pointer.release();
		await grid.settle();
		const a = at(grid, 'a')!;
		const n = at(grid, 'n')!;
		// jsdom releases before n registers; a browser's real release can come after it.
		if (IN_JSDOM) expect(overlapping(a, n)).toBe(true);
		else expect([1, 2]).toContain(a.x);
	});
});

type TimingOp = { kind: 'move'; dx: number; dy: number } | { kind: 'spawn' } | { kind: 'despawn' } | { kind: 'settle' };

const timingOp: fc.Arbitrary<TimingOp> = fc.oneof(
	fc.record({
		kind: fc.constant('move' as const),
		dx: fc.integer({ min: -1, max: 3 }),
		dy: fc.integer({ min: 0, max: 2 })
	}),
	fc.constant({ kind: 'spawn' as const }),
	fc.constant({ kind: 'despawn' as const }),
	fc.constant({ kind: 'settle' as const })
);

describe('none mode: random spawns and removals under a held drag', () => {
	// Moves, spawns on the outline's cell, removals and settles in any order, with or without a
	// settle between moves; the release always comes after a settle (see the same-tick case above).
	test('the dragged item never ends on an item placed during the drag', async () => {
		const runs = IN_JSDOM ? Math.max(inject('layoutPropertyRuns'), 200) : inject('layoutPropertyRuns');
		await expect(
			fc.assert(
				fc.asyncProperty(fc.array(timingOp, { minLength: 1, maxLength: 16 }), fc.boolean(), async (ops, fast) => {
					const grid = await noneGrid([item('a', 0, 0)]);
					try {
						const spawned: string[] = [];
						const steps: DragStep[] = ops.map((op, i): DragStep => {
							switch (op.kind) {
								case 'move': {
									return [op.dx, op.dy];
								}
								case 'spawn': {
									return () => {
										spawnOnOutline(grid, `n${i}`);
										spawned.push(`n${i}`);
									};
								}
								case 'despawn': {
									return () => {
										const id = spawned.pop();
										if (id) grid.component.remove(id);
									};
								}
								case 'settle': {
									return () => grid.settle();
								}
							}
						});
						await grid.dragSteps('a', [...steps, () => grid.settle()], { fast });
						const a = at(grid, 'a')!;
						for (const other of grid.component.snapshot().filter((i) => i.id !== 'a')) {
							const box = at(grid, other.id)!;
							// Only an item placed on a's own cell, where it stays, may overlap it.
							const onStart = overlapping(box, { x: 0, y: 0, w: 1, h: 1 });
							if (overlapping(a, box)) expect(onStart && a.x === 0 && a.y === 0, `a on ${other.id}`).toBe(true);
						}
					} finally {
						grid.unmount();
					}
				}),
				{ numRuns: runs }
			)
		).resolves.toBeUndefined();
	}, 600_000);
});
