import { describe, expect, test } from 'vitest';
import fc from 'fast-check';

import { blockingRow, hasCollisions } from '../../src/lib/utils/grid';
import type { LayoutItem } from '../../src/lib/types';
import { createTestItem } from './test-helpers';

/** The loop blockingRow replaced, kept as the reference it must agree with. */
function referenceBlockingRow(item: LayoutItem, items: LayoutItem[], fromY: number): number {
	let newY = fromY;
	while (newY >= 0) {
		if (hasCollisions({ ...item, y: newY }, items)) break;
		newY--;
	}
	return newY;
}

const cell = (id: string, x: number, y: number, w: number, h: number) =>
	createTestItem({ id, x, y, w, h, movable: true, resizable: true });

const itemArb = (id: string) =>
	fc
		.record({ x: fc.nat(6), y: fc.nat(12), w: fc.integer({ min: 1, max: 4 }), h: fc.integer({ min: 1, max: 4 }) })
		.map((b) => cell(id, b.x, b.y, b.w, b.h));

describe('blockingRow()', () => {
	test('agrees with the row-by-row loop it replaced', () => {
		fc.assert(
			fc.property(
				itemArb('moving'),
				fc.array(fc.nat(1000), { maxLength: 8 }).chain((ids) => fc.tuple(...ids.map((_, i) => itemArb(`o${i}`)))),
				fc.oneof(fc.integer({ min: -3, max: 40 }), fc.constant(Number.NaN)),
				(item, others, fromY) => {
					expect(blockingRow(item, others, fromY)).toEqual(referenceBlockingRow(item, others, fromY));
				}
			),
			{ numRuns: 2000 }
		);
	});

	test('takes steps bounded by the content height, not by the start row', () => {
		const items = [cell('a', 0, 0, 1, 1)];
		let checks = 0;
		const counting = new Proxy(items, {
			get(target, key, receiver) {
				if (key === 'some') checks++;
				return Reflect.get(target, key, receiver);
			}
		});
		expect(blockingRow(cell('far', 0, 1_000_000, 1, 1), counting, 1_000_000)).toBe(0);
		expect(checks).toBeLessThanOrEqual(2);
	});
});
