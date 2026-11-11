/**
 * Random-operation layout scenarios: the operations a page performs on a grid, an
 * interpreter that applies them through the harness, and a checker that runs every layout
 * invariant after each step. The property tests generate sequences; the regression tests
 * replay the shrunk counterexamples they found.
 */
import { expect } from 'vitest';
import fc from 'fast-check';

import {
	FIXED_SIZE,
	layoutProblems,
	mountLayout,
	type DragStep,
	type LayoutSpec,
	type MountedLayout
} from './layout-harness';
import { findGridSize } from '../../src/lib/utils/breakpoints';
import type { Breakpoints, Collision, GridSize } from '../../src/lib/types';

type SimpleOp =
	| { kind: 'addFree'; w: number; h: number }
	| { kind: 'addUnplaced'; w: number; h: number }
	| { kind: 'remove'; pick: number }
	| { kind: 'patch'; pick: number; x: number; y: number; w: number; h: number }
	| { kind: 'cols'; cols: number };

export type Op =
	| SimpleOp
	| { kind: 'drag'; pick: number; dx: number; dy: number }
	| { kind: 'dragPath'; pick: number; path: [number, number][] }
	| { kind: 'resize'; pick: number; dw: number; dh: number }
	| { kind: 'containerResize' }
	| { kind: 'width'; width: number }
	/** Several changes in the same tick, before any effect runs. */
	| { kind: 'batch'; ops: SimpleOp[] }
	/** A hostile drag: wild pointer jumps, optionally many per tick, with page changes between them. */
	| { kind: 'dragWild'; pick: number; fast: boolean; steps: WildStep[] };

/** One step of a hostile drag. */
type WildStep =
	| { kind: 'move'; dx: number; dy: number }
	| { kind: 'op'; op: SimpleOp }
	/** The page removes the item being dragged. */
	| { kind: 'removeDragged' }
	/** The page switches the collision mode mid-drag; it is switched back after the drop. */
	| { kind: 'flip'; to: Collision };

export type ScenarioConfig = {
	collision: Collision;
	rows: number;
	withPatches: boolean;
	gap?: number;
	/** Breakpoint-based cols; the container width then decides the column count. */
	breakpointCols?: Exclude<GridSize, number>;
};

// The Grid's default breakpoints, which breakpoint-based cols are resolved against.
const BREAKPOINTS: Breakpoints = { xxl: 1536, xl: 1280, lg: 1024, md: 768, sm: 640, xs: 320 };

const size = fc.integer({ min: 1, max: 3 });
const pick = fc.nat();
const cell = fc.integer({ min: -3, max: 4 });

function simpleOpArb(config: ScenarioConfig): fc.Arbitrary<SimpleOp> {
	const patch = fc.record({
		kind: fc.constant('patch' as const),
		pick,
		x: fc.integer({ min: -2, max: 9 }),
		y: fc.integer({ min: -2, max: 9 }),
		w: fc.integer({ min: 1, max: 7 }),
		h: fc.integer({ min: 1, max: 4 })
	});
	const cols = fc.record({ kind: fc.constant('cols' as const), cols: fc.integer({ min: 2, max: 6 }) });
	return fc.oneof(
		fc.record({ kind: fc.constant('addFree' as const), w: size, h: size }),
		fc.record({ kind: fc.constant('addUnplaced' as const), w: size, h: size }),
		fc.record({ kind: fc.constant('remove' as const), pick }),
		...(config.withPatches ? [patch] : []),
		...(config.breakpointCols ? [] : [cols])
	);
}

function wildStepArb(config: ScenarioConfig): fc.Arbitrary<WildStep> {
	// Fractional cells, far outside the grid on every side.
	const coordinate = fc.double({ min: -6, max: 9, noNaN: true });
	return fc.oneof(
		{ weight: 4, arbitrary: fc.record({ kind: fc.constant('move' as const), dx: coordinate, dy: coordinate }) },
		{ weight: 2, arbitrary: fc.record({ kind: fc.constant('op' as const), op: simpleOpArb(config) }) },
		{ weight: 1, arbitrary: fc.constant({ kind: 'removeDragged' as const }) },
		{
			weight: 1,
			arbitrary: fc.record({
				kind: fc.constant('flip' as const),
				to: fc.constantFrom<Collision>('none', 'push', 'compress', 'shift')
			})
		}
	);
}

export function opArb(config: ScenarioConfig): fc.Arbitrary<Op> {
	const simple = simpleOpArb(config);
	return fc.oneof(
		fc.record({
			kind: fc.constant('dragWild' as const),
			pick,
			fast: fc.boolean(),
			steps: fc.array(wildStepArb(config), { minLength: 1, maxLength: 8 })
		}),
		simple,
		fc.record({ kind: fc.constant('drag' as const), pick, dx: cell, dy: cell }),
		fc.record({
			kind: fc.constant('dragPath' as const),
			pick,
			path: fc.array(fc.tuple(cell, cell), { minLength: 2, maxLength: 4 })
		}),
		fc.record({
			kind: fc.constant('resize' as const),
			pick,
			dw: fc.integer({ min: -2, max: 3 }),
			dh: fc.integer({ min: -2, max: 3 })
		}),
		fc.constant({ kind: 'containerResize' as const }),
		...(config.breakpointCols
			? [fc.record({ kind: fc.constant('width' as const), width: fc.constantFrom(320, 700, 1024, 1600) })]
			: []),
		fc.record({ kind: fc.constant('batch' as const), ops: fc.array(simple, { minLength: 2, maxLength: 3 }) })
	);
}

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

type Run = {
	mounted: MountedLayout;
	config: ScenarioConfig;
	cols: number;
	rows: number;
	nextId: number;
	resizeTo: (width: number, height: number) => void;
	/** Set while a batch has changed the layout and no effect has run yet. */
	unsettled: boolean;
	/** During a batch, the items that had registered before it; only they can be targeted. */
	registered?: Set<string>;
};

function chosen(run: Run, index: number): LayoutSpec | undefined {
	const items = run.mounted.component.snapshot().filter((i) => !run.registered || run.registered.has(i.id));
	return items.length > 0 ? items[index % items.length] : undefined;
}

/**
 * Adds an item at a cell that is free right now. Skipped after another change in the same
 * tick: the layout has not settled, so the free cell is stale, and two items registered on
 * one cell is PR #9's case (registration does not relocate them).
 */
function addFree(run: Run, id: string, op: { w: number; h: number }): void {
	if (run.unsettled) return;
	const items = run.mounted.component.snapshot();
	const w = Math.min(op.w, run.cols);
	const free = freeCell(items, run.cols, run.rows, w, op.h);
	if (free) run.mounted.component.add({ id, ...free, w, h: op.h });
}

function applySimple(run: Run, op: SimpleOp): void {
	const { component } = run.mounted;
	const id = `n${run.nextId++}`;
	const target = 'pick' in op ? chosen(run, op.pick) : undefined;
	switch (op.kind) {
		case 'addFree': {
			addFree(run, id, op);
			break;
		}
		case 'addUnplaced': {
			component.add({ id, w: op.w, h: op.h });
			break;
		}
		case 'remove': {
			if (target) component.remove(target.id);
			break;
		}
		case 'patch': {
			if (target) component.patch(target.id, { x: op.x, y: op.y, w: op.w, h: op.h });
			break;
		}
		case 'cols': {
			run.cols = op.cols;
			component.setGrid({ cols: op.cols });
			break;
		}
	}
}

async function dragWild(run: Run, id: string, op: Extract<Op, { kind: 'dragWild' }>): Promise<void> {
	const { component } = run.mounted;
	const steps = op.steps.map((step): DragStep => {
		switch (step.kind) {
			case 'move': {
				return [step.dx, step.dy];
			}
			case 'op': {
				return () => applySimple(run, step.op);
			}
			case 'removeDragged': {
				return () => component.remove(id);
			}
			case 'flip': {
				return () => component.setGrid({ collision: step.to });
			}
		}
	});
	await run.mounted.dragSteps(id, steps, { fast: op.fast });
	component.setGrid({ collision: run.config.collision });
}

function resizeContainer(run: Run, width: number): void {
	if (run.config.breakpointCols) run.cols = findGridSize(run.config.breakpointCols, width, BREAKPOINTS);
	run.resizeTo(width, run.rows === Infinity ? 1000 : run.rows * run.mounted.pitch);
}

async function apply(run: Run, op: Op): Promise<void> {
	const target = 'pick' in op ? chosen(run, op.pick) : undefined;
	switch (op.kind) {
		case 'drag': {
			if (target) await run.mounted.drag(target.id, op.dx, op.dy);
			break;
		}
		case 'dragPath': {
			if (target) await run.mounted.dragPath(target.id, op.path);
			break;
		}
		case 'dragWild': {
			if (target) await dragWild(run, target.id, op);
			break;
		}
		case 'resize': {
			if (target) await run.mounted.resize(target.id, op.dw, op.dh);
			break;
		}
		case 'containerResize': {
			resizeContainer(run, run.cols * run.mounted.pitch);
			break;
		}
		case 'width': {
			resizeContainer(run, op.width);
			break;
		}
		case 'batch': {
			run.registered = new Set(run.mounted.component.snapshot().map((i) => i.id));
			for (const inner of op.ops) {
				applySimple(run, inner);
				run.unsettled = true;
			}
			run.unsettled = false;
			run.registered = undefined;
			break;
		}
		default: {
			applySimple(run, op);
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

/**
 * Mounts an empty 4-column grid, applies `ops` in order and asserts after every step that
 * the layout has no avoidable problem. Fails with the step and operation that broke it.
 */
export async function runScenario(
	config: ScenarioConfig,
	ops: Op[],
	resizeTo: (width: number, height: number) => void
): Promise<void> {
	const { collision, rows, withPatches } = config;
	const fixedRows = rows || Infinity;
	const cols = config.breakpointCols ?? 4;
	const mounted = mountLayout({ grid: { cols, rows, collision, gap: config.gap ?? 0, ...FIXED_SIZE }, items: [] });
	const run: Run = { mounted, config, cols: 4, rows: fixedRows, nextId: 0, resizeTo, unsettled: false };
	await mounted.settle();
	if (config.breakpointCols) {
		resizeContainer(run, 1024);
		await mounted.settle();
	}
	try {
		for (const [step, op] of ops.entries()) {
			await apply(run, op);
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
