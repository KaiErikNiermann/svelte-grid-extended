/**
 * Random-operation layout scenarios: the operations a page performs on a grid, an
 * interpreter that applies them through the harness, and a checker that runs every layout
 * invariant after each step. The property tests generate sequences; the regression tests
 * replay the shrunk counterexamples they found.
 */
import { expect } from 'vitest';
import fc from 'fast-check';

import { FIXED_SIZE, layoutProblems, mountLayout, type LayoutSpec, type MountedLayout } from './layout-harness';
import type { Collision } from '../../src/lib/types';

export type Op =
	| { kind: 'addFree'; w: number; h: number }
	| { kind: 'addUnplaced'; w: number; h: number }
	| { kind: 'remove'; pick: number }
	| { kind: 'patch'; pick: number; x: number; y: number; w: number; h: number }
	| { kind: 'drag'; pick: number; dx: number; dy: number }
	| { kind: 'resize'; pick: number; dw: number; dh: number }
	| { kind: 'cols'; cols: number }
	| { kind: 'containerResize' };

const size = fc.integer({ min: 1, max: 3 });
const pick = fc.nat();
export const opArb = (withPatches: boolean): fc.Arbitrary<Op> =>
	fc.oneof(
		fc.record({ kind: fc.constant('addFree' as const), w: size, h: size }),
		fc.record({ kind: fc.constant('addUnplaced' as const), w: size, h: size }),
		fc.record({ kind: fc.constant('remove' as const), pick }),
		...(withPatches
			? [
					fc.record({
						kind: fc.constant('patch' as const),
						pick,
						x: fc.integer({ min: -2, max: 9 }),
						y: fc.integer({ min: -2, max: 9 }),
						w: fc.integer({ min: 1, max: 7 }),
						h: fc.integer({ min: 1, max: 4 })
					})
				]
			: []),
		fc.record({
			kind: fc.constant('drag' as const),
			pick,
			dx: fc.integer({ min: -3, max: 4 }),
			dy: fc.integer({ min: -3, max: 4 })
		}),
		fc.record({
			kind: fc.constant('resize' as const),
			pick,
			dw: fc.integer({ min: -2, max: 3 }),
			dh: fc.integer({ min: -2, max: 3 })
		}),
		fc.record({ kind: fc.constant('cols' as const), cols: fc.integer({ min: 2, max: 6 }) }),
		fc.constant({ kind: 'containerResize' as const })
	);

function occupied(items: LayoutSpec[], x: number, y: number, w: number, h: number): boolean {
	return items.some((i) => x < i.x! + i.w && i.x! < x + w && y < i.y! + i.h && i.y! < y + h);
}

/** First free cell scanning rows top-down, the way a page would pick one for a new item. */
function freeCell(items: LayoutSpec[], cols: number, rows: number, w: number, h: number) {
	for (let y = 0; y + h <= rows; y++) {
		for (let x = 0; x + w <= cols; x++) {
			if (!occupied(items, x, y, w, h)) return { x, y };
		}
	}
	return null;
}

type Run = { mounted: MountedLayout; cols: number; rows: number; nextId: number };

function chosen(run: Run, index: number): LayoutSpec | undefined {
	const items = run.mounted.component.snapshot();
	return items.length > 0 ? items[index % items.length] : undefined;
}

async function apply(run: Run, op: Op, resizeTo: (width: number, height: number) => void): Promise<void> {
	const { component } = run.mounted;
	const id = `n${run.nextId++}`;
	switch (op.kind) {
		case 'addFree': {
			const free = freeCell(component.snapshot(), run.cols, run.rows, Math.min(op.w, run.cols), op.h);
			if (free) component.add({ id, ...free, w: Math.min(op.w, run.cols), h: op.h });
			break;
		}
		case 'addUnplaced': {
			component.add({ id, w: op.w, h: op.h });
			break;
		}
		case 'remove': {
			const target = chosen(run, op.pick);
			if (target) component.remove(target.id);
			break;
		}
		case 'patch': {
			const target = chosen(run, op.pick);
			if (target) component.patch(target.id, { x: op.x, y: op.y, w: op.w, h: op.h });
			break;
		}
		case 'drag': {
			const target = chosen(run, op.pick);
			if (target) await run.mounted.drag(target.id, op.dx, op.dy);
			break;
		}
		case 'resize': {
			const target = chosen(run, op.pick);
			if (target) await run.mounted.resize(target.id, op.dw, op.dh);
			break;
		}
		case 'cols': {
			run.cols = op.cols;
			component.setGrid({ cols: op.cols });
			break;
		}
		case 'containerResize': {
			resizeTo(run.cols * 100, run.rows === Infinity ? 1000 : run.rows * 100);
			break;
		}
	}
	await run.mounted.settle();
}

/**
 * An overlap is forced when a fixed-size grid has no free cell left for either item, e.g.
 * after cols shrinks below what the items need. The grid keeps such an item inside rather
 * than drawing it outside, so only avoidable overlaps count as failures.
 */
function avoidable(problem: string, items: LayoutSpec[], cols: number, rows: number): boolean {
	const match = /^(\S+) overlaps (\S+)$/.exec(problem);
	if (!match || rows === Infinity) return true;
	return match.slice(1).every((id) => {
		const it = items.find((i) => i.id === id)!;
		return (
			freeCell(
				items.filter((o) => o.id !== id),
				cols,
				rows,
				it.w,
				it.h
			) !== null
		);
	});
}

/** In compress mode every item sits at the top or directly under another item. */
function compressProblems(items: LayoutSpec[]): string[] {
	return items
		.filter(
			(i) =>
				i.y! > 0 &&
				!occupied(
					items.filter((o) => o.id !== i.id),
					i.x!,
					i.y! - 1,
					i.w,
					i.h
				)
		)
		.map((i) => `${i.id}(${i.x},${i.y}) could move up`);
}

export type ScenarioConfig = { collision: Collision; rows: number; withPatches: boolean };

/**
 * Mounts an empty 4-column grid, applies `ops` in order and asserts after every step that
 * the layout has no avoidable problem. Fails with the step and operation that broke it.
 */
export async function runScenario(
	{ collision, rows, withPatches }: ScenarioConfig,
	ops: Op[],
	resizeTo: (width: number, height: number) => void
): Promise<void> {
	const fixedRows = rows || Infinity;
	const mounted = mountLayout({ grid: { cols: 4, rows, collision, ...FIXED_SIZE }, items: [] });
	const run: Run = { mounted, cols: 4, rows: fixedRows, nextId: 0 };
	await mounted.settle();
	try {
		for (const [step, op] of ops.entries()) {
			await apply(run, op, resizeTo);
			const items = mounted.component.snapshot();
			const problems = [
				...layoutProblems(mounted, {
					collision,
					cols: run.cols,
					rows: fixedRows,
					allowOverlap: withPatches && collision === 'none'
				}).filter((p) => avoidable(p, items, run.cols, fixedRows)),
				...(collision === 'compress' ? compressProblems(items) : [])
			];
			expect(problems, `after step ${step} ${JSON.stringify(op)}`).toEqual([]);
		}
	} finally {
		mounted.unmount();
	}
}
