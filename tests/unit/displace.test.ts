import { describe, expect, test } from 'vitest';
import fc from 'fast-check';

import {
	coverage,
	directionAway,
	displaceStep,
	layoutAround,
	nearestFree,
	type DragState,
	type Placed
} from '../../src/lib/utils/displace';

const box = (id: string, x: number, y: number, w = 1, h = 1): Placed => ({ id, x, y, w, h });
const LIMITS = { cols: 4, rows: Infinity };
const start = (): DragState => ({ displaced: new Set(), target: { x: 0, y: 0 }, layout: new Map() });

describe('coverage()', () => {
	test('is the shared area over the smaller area', () => {
		expect(coverage(box('a', 0, 0), box('b', 0.5, 0))).toBe(0.5);
		expect(coverage(box('a', 0, 0), box('b', 0, 0, 3, 3))).toBe(1);
		expect(coverage(box('a', 0, 0), box('b', 1, 0))).toBe(0);
	});
});

describe('directionAway()', () => {
	test.each([
		[box('d', -0.6, 0), 'right'],
		[box('d', 0.6, 0), 'left'],
		[box('d', 0, -0.6), 'down'],
		[box('d', 0, 0.6), 'up']
	] as const)('an item approached from %o moves %s', (dragged, dir) => {
		expect(directionAway(dragged, box('b', 0, 0))).toBe(dir);
	});

	test('a wide item approached from above moves down', () => {
		expect(directionAway(box('d', 1.2, -0.6), box('b', 0, 0, 4, 1))).toBe('down');
	});
});

describe('layoutAround()', () => {
	test('leaves everything where it was when the target is free', () => {
		const snapshot = [box('a', 1, 0), box('b', 2, 1)];
		const layout = layoutAround(snapshot, box('d', 0, 0), box('d', 0, 0), LIMITS);
		expect(Object.fromEntries(layout!)).toEqual({ a: { x: 1, y: 0 }, b: { x: 2, y: 1 } });
	});

	test('pushes from the left to the right and chains into the next item', () => {
		const snapshot = [box('b', 1, 0), box('c', 2, 0)];
		const layout = layoutAround(snapshot, box('d', 1, 0), box('d', 0.4, 0), LIMITS);
		expect(Object.fromEntries(layout!)).toEqual({ b: { x: 2, y: 0 }, c: { x: 3, y: 0 } });
	});

	test('wraps an item pushed past the right edge to the start of the next row', () => {
		const snapshot = [box('b', 3, 0)];
		const layout = layoutAround(snapshot, box('d', 3, 0), box('d', 2.4, 0), LIMITS);
		expect(layout!.get('b')).toEqual({ x: 0, y: 1 });
	});

	test('pushes from the right to the left', () => {
		const layout = layoutAround([box('b', 2, 0)], box('d', 2, 0), box('d', 2.6, 0), LIMITS);
		expect(layout!.get('b')).toEqual({ x: 1, y: 0 });
	});

	test('pushes from above downwards', () => {
		const layout = layoutAround([box('b', 1, 1)], box('d', 1, 1), box('d', 1, 0.4), LIMITS);
		expect(layout!.get('b')).toEqual({ x: 1, y: 2 });
	});

	test('wraps an item pushed past the bottom of a fixed grid to the top', () => {
		const layout = layoutAround([box('b', 1, 2)], box('d', 1, 2), box('d', 1, 1.4), { cols: 4, rows: 3 });
		expect(layout!.get('b')).toEqual({ x: 1, y: 0 });
	});

	test('returns null when a fixed grid has no room left', () => {
		const snapshot = [box('a', 0, 0), box('b', 1, 0)];
		expect(layoutAround(snapshot, box('d', 0, 0, 2, 1), box('d', 0, 0, 2, 1), { cols: 2, rows: 1 })).toBeNull();
	});
});

describe('nearestFree()', () => {
	test('picks the closest free cell, not the first in reading order', () => {
		const taken = [box('a', 2, 2)];
		expect(nearestFree(box('n', 0, 0), { x: 2, y: 2 }, taken, { cols: 5, rows: 5 })).toEqual({ x: 1, y: 1 });
	});
});

describe('displaceStep()', () => {
	test('hovers without moving anything until the coverage threshold', () => {
		const snapshot = [box('b', 1, 0)];
		const hover = displaceStep(snapshot, { w: 1, h: 1 }, { x: 0.3, y: 0 }, { x: 0, y: 0 }, start(), LIMITS);
		expect(hover.changed).toBe(false);
		const over = displaceStep(snapshot, { w: 1, h: 1 }, { x: 0.6, y: 0 }, { x: 1, y: 0 }, hover, LIMITS);
		expect(over.changed).toBe(true);
		expect(over.layout.get('b')).toEqual({ x: 2, y: 0 });
	});

	test('puts a displaced item back once the drag moves on', () => {
		const snapshot = [box('b', 1, 0)];
		const over = displaceStep(snapshot, { w: 1, h: 1 }, { x: 0.6, y: 0 }, { x: 1, y: 0 }, start(), LIMITS);
		const away = displaceStep(snapshot, { w: 1, h: 1 }, { x: 1, y: 2 }, { x: 1, y: 2 }, over, LIMITS);
		expect(away.layout.get('b')).toEqual({ x: 1, y: 0 });
	});

	test('keeps a displaced item displaced between the two thresholds', () => {
		const snapshot = [box('b', 1, 0)];
		const over = displaceStep(snapshot, { w: 1, h: 1 }, { x: 0.6, y: 0 }, { x: 1, y: 0 }, start(), LIMITS);
		expect(displaceStep(snapshot, { w: 1, h: 1 }, { x: 0.4, y: 0 }, { x: 0, y: 0 }, over, LIMITS).displaced).toEqual(
			new Set(['b'])
		);
	});
});

const placedArb = (cols: number) =>
	fc
		.array(
			fc.record({
				x: fc.nat(cols - 1),
				y: fc.nat(5),
				w: fc.integer({ min: 1, max: 2 }),
				h: fc.integer({ min: 1, max: 2 })
			}),
			{ maxLength: 10 }
		)
		.map((boxes) => {
			// Keep only boxes that fit and do not overlap the ones before them: a valid start layout.
			const kept: Placed[] = [];
			for (const [i, b] of boxes.entries()) {
				const p = { id: `i${i}`, ...b };
				if (p.x + p.w <= cols && !kept.some((k) => coverage(k, p) > 0)) kept.push(p);
			}
			return kept;
		});

describe('layoutAround() properties', () => {
	test('any layout it returns is inside the grid and free of overlaps, the dragged item included', () => {
		const cols = 5;
		fc.assert(
			fc.property(
				placedArb(cols),
				fc.record({
					x: fc.nat(cols - 1),
					y: fc.nat(6),
					w: fc.integer({ min: 1, max: 2 }),
					h: fc.integer({ min: 1, max: 2 })
				}),
				fc.double({ min: -0.49, max: 0.49, noNaN: true }),
				fc.double({ min: -0.49, max: 0.49, noNaN: true }),
				fc.constantFrom(Infinity, 8),
				(snapshot, t, dx, dy, rows) => {
					const dragged = { ...t, w: Math.min(t.w, cols - t.x) };
					const limits = { cols, rows };
					const layout = layoutAround(snapshot, dragged, { ...dragged, x: dragged.x + dx, y: dragged.y + dy }, limits);
					if (!layout) return;
					const placed = snapshot.map((s) => ({ ...s, ...layout.get(s.id)! }));
					for (const [i, a] of placed.entries()) {
						expect(a.x >= 0 && a.y >= 0 && a.x + a.w <= cols && a.y + a.h <= rows).toBe(true);
						expect(coverage(a, dragged)).toBe(0);
						for (const b of placed.slice(i + 1)) expect(coverage(a, b)).toBe(0);
					}
				}
			),
			{ numRuns: 3000 }
		);
	});

	test('always finds a layout when rows are unbounded', () => {
		const cols = 5;
		fc.assert(
			fc.property(placedArb(cols), fc.nat(cols - 1), fc.nat(6), (snapshot, x, y) => {
				expect(
					layoutAround(snapshot, { x, y, w: 1, h: 1 }, { x, y, w: 1, h: 1 }, { cols, rows: Infinity })
				).not.toBeNull();
			}),
			{ numRuns: 2000 }
		);
	});
});
