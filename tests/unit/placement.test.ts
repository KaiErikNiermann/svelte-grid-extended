import { describe, expect, test } from 'vitest';

import { assignBox, clampToLimits, hasPosition, pushAside, relocateIfColliding } from '../../src/lib/utils/placement';
import { createTestItem } from './test-helpers';

const cell = (id: string, x: number, y: number, w = 1, h = 1) =>
	createTestItem({ id, x, y, w, h, movable: true, resizable: true });

const bounded = { maxCols: 4, maxRows: 3 };
const unbounded = { maxCols: Infinity, maxRows: Infinity };

describe('clampToLimits()', () => {
	test.each([
		{ box: { x: 1, y: 1, w: 2, h: 1 }, limits: bounded, expected: { x: 1, y: 1, w: 2, h: 1 } },
		{ box: { x: 6, y: 0, w: 1, h: 1 }, limits: bounded, expected: { x: 3, y: 0, w: 1, h: 1 } },
		{ box: { x: 3, y: 0, w: 2, h: 1 }, limits: bounded, expected: { x: 2, y: 0, w: 2, h: 1 } },
		{ box: { x: 0, y: 0, w: 6, h: 5 }, limits: bounded, expected: { x: 0, y: 0, w: 4, h: 3 } },
		{ box: { x: -2, y: -1, w: 1, h: 1 }, limits: bounded, expected: { x: 0, y: 0, w: 1, h: 1 } },
		{ box: { x: 0, y: 0, w: 0, h: 0 }, limits: bounded, expected: { x: 0, y: 0, w: 1, h: 1 } },
		{ box: { x: 50, y: 80, w: 9, h: 9 }, limits: unbounded, expected: { x: 50, y: 80, w: 9, h: 9 } },
		{ box: { x: -1, y: -1, w: 1, h: 1 }, limits: unbounded, expected: { x: 0, y: 0, w: 1, h: 1 } }
	])('clamps $box into $limits', ({ box, limits, expected }) => {
		expect(clampToLimits(box, limits)).toEqual(expected);
	});
});

describe('hasPosition()', () => {
	test.each([
		{ x: 0, y: 0, expected: true },
		{ x: undefined, y: 0, expected: false },
		{ x: 0, y: Number.NaN, expected: false },
		{ x: Infinity, y: 0, expected: false }
	])('($x, $y) -> $expected', ({ x, y, expected }) => {
		expect(hasPosition({ x: x as number, y: y as number })).toBe(expected);
	});
});

describe('assignBox()', () => {
	test('reports a change only when a field differs', () => {
		const item = cell('a', 1, 2, 1, 1);
		expect(assignBox(item, { x: 1, y: 2, w: 1, h: 1 })).toBe(false);
		expect(assignBox(item, { x: 1, y: 2, w: 2, h: 1 })).toBe(true);
		expect(item).toMatchObject({ x: 1, y: 2, w: 2, h: 1 });
	});
});

describe('pushAside()', () => {
	test('moves each covered item to a free cell and keeps the pusher in place', () => {
		const pusher = cell('p', 0, 0, 2, 1);
		const a = cell('a', 0, 0);
		const b = cell('b', 1, 0);
		const moved = pushAside(pusher, [pusher, a, b], { maxCols: 4, maxRows: Infinity });

		expect(moved.map((i) => i.id)).toEqual(['a', 'b']);
		expect(pusher).toMatchObject({ x: 0, y: 0 });
		// b must see where a went, or both would land on (2, 0).
		expect([a, b].map(({ x, y }) => ({ x, y }))).toEqual([
			{ x: 2, y: 0 },
			{ x: 3, y: 0 }
		]);
	});

	test('leaves an item in place when a bounded grid has no room for it', () => {
		const pusher = cell('p', 0, 0);
		const a = cell('a', 0, 0);
		const full = cell('f', 1, 0);
		expect(pushAside(pusher, [pusher, a, full], { maxCols: 2, maxRows: 1 })).toEqual([]);
		expect(a).toMatchObject({ x: 0, y: 0 });
	});
});

describe('relocateIfColliding()', () => {
	const other = cell('o', 0, 0, 2, 1);

	test('keeps a box that collides with nothing', () => {
		const item = cell('i', 0, 1);
		expect(relocateIfColliding(item, { x: 0, y: 1, w: 1, h: 1 }, [other], bounded)).toEqual({ x: 0, y: 1, w: 1, h: 1 });
	});

	test('moves a colliding box to the first free cell', () => {
		const item = cell('i', 0, 0);
		expect(relocateIfColliding(item, { x: 0, y: 0, w: 1, h: 1 }, [other], bounded)).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	test('keeps the box when the grid is full', () => {
		const item = cell('i', 0, 0);
		const box = { x: 0, y: 0, w: 1, h: 1 };
		expect(relocateIfColliding(item, box, [other], { maxCols: 2, maxRows: 1 })).toEqual(box);
	});
});
