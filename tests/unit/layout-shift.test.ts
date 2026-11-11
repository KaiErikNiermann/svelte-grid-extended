import { describe, expect, test } from 'vitest';

import { cancelPointer, FIXED_SIZE, item, layoutProblems, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

const at = (grid: ReturnType<typeof mountLayout>, id: string) => {
	const found = grid.component.snapshot().find((i) => i.id === id)!;
	return { x: found.x, y: found.y };
};

describe('shift collision', () => {
	test('an item approached from the left moves right, and the drop keeps it there', async () => {
		const grid = mountLayout({
			grid: { cols: 4, collision: 'shift', ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 1, 0)]
		});
		await grid.settle();
		await grid.dragPath('a', [
			[0.3, 0],
			[0.7, 0],
			[1, 0]
		]);

		expect(at(grid, 'a')).toEqual({ x: 1, y: 0 });
		expect(at(grid, 'b')).toEqual({ x: 2, y: 0 });
		expect(layoutProblems(grid, { collision: 'shift', cols: 4, rows: Infinity })).toEqual([]);
	});

	test('hovering below the coverage threshold moves nothing', async () => {
		const grid = mountLayout({
			grid: { cols: 4, collision: 'shift', ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 1, 0)]
		});
		await grid.settle();
		await grid.dragPath('a', [[0.4, 0]]);

		expect(at(grid, 'a')).toEqual({ x: 0, y: 0 });
		expect(at(grid, 'b')).toEqual({ x: 1, y: 0 });
	});

	test('an item that made way returns when the drag moves on', async () => {
		const grid = mountLayout({
			grid: { cols: 4, collision: 'shift', ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 1, 0)]
		});
		await grid.settle();
		await grid.dragPath('a', [
			[0.7, 0],
			[1, 0],
			[1, 1],
			[1, 2]
		]);

		expect(at(grid, 'a')).toEqual({ x: 1, y: 2 });
		expect(at(grid, 'b')).toEqual({ x: 1, y: 0 });
	});

	test('an item approached from above moves down', async () => {
		const grid = mountLayout({
			grid: { cols: 4, collision: 'shift', ...FIXED_SIZE },
			items: [item('a', 1, 0), item('b', 1, 1)]
		});
		await grid.settle();
		await grid.dragPath('a', [
			[0, 0.7],
			[0, 1]
		]);

		expect(at(grid, 'a')).toEqual({ x: 1, y: 1 });
		expect(at(grid, 'b')).toEqual({ x: 1, y: 2 });
	});

	test('an item added under the drag target takes the nearest free cell, and the drop lands', async () => {
		const grid = mountLayout({ grid: { cols: 4, collision: 'shift', ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		await grid.drag('a', 2, 0, async () => {
			grid.component.add(item('b', 2, 0));
			await grid.settle();
		});

		expect(at(grid, 'a')).toEqual({ x: 2, y: 0 });
		expect(at(grid, 'b')).toEqual({ x: 1, y: 0 });
		expect(layoutProblems(grid, { collision: 'shift', cols: 4, rows: Infinity })).toEqual([]);
	});

	test('an item moved by props onto the drag target takes the nearest free cell', async () => {
		const grid = mountLayout({
			grid: { cols: 4, collision: 'shift', ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 3, 2)]
		});
		await grid.settle();
		await grid.drag('a', 2, 0, async () => {
			grid.component.patch('b', { x: 2, y: 0 });
			await grid.settle();
		});

		expect(at(grid, 'a')).toEqual({ x: 2, y: 0 });
		expect(at(grid, 'b')).not.toEqual({ x: 2, y: 0 });
		expect(layoutProblems(grid, { collision: 'shift', cols: 4, rows: Infinity })).toEqual([]);
	});

	test('a new item declared on an occupied cell takes a free one', async () => {
		const grid = mountLayout({
			grid: { cols: 4, collision: 'shift', ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 0, 0)]
		});
		await grid.settle();

		expect(layoutProblems(grid, { collision: 'shift', cols: 4, rows: Infinity })).toEqual([]);
	});
});

const mountShift = async (items: ReturnType<typeof item>[], cols = 4) => {
	const grid = mountLayout({ grid: { cols, collision: 'shift', ...FIXED_SIZE }, items });
	await grid.settle();
	return grid;
};
const problems = (grid: ReturnType<typeof mountLayout>, cols = 4) =>
	layoutProblems(grid, { collision: 'shift', cols, rows: Infinity });

describe('shift collision under hostile input', () => {
	test('one jump across the whole grid lands the item and moves only what is under the target', async () => {
		const grid = await mountShift([item('a', 0, 0), item('b', 1, 1), item('c', 3, 3)]);
		await grid.dragPath('a', [[3, 3]]);

		expect(at(grid, 'a')).toEqual({ x: 3, y: 3 });
		expect(at(grid, 'b')).toEqual({ x: 1, y: 1 });
		expect(at(grid, 'c')).not.toEqual({ x: 3, y: 3 });
		expect(problems(grid)).toEqual([]);
	});

	test('many moves in one tick, back and forth over a row, end with the row as it started', async () => {
		const grid = await mountShift([item('a', 0, 0), item('b', 1, 0), item('c', 2, 0), item('d', 3, 0)]);
		const sweep = Array.from({ length: 40 }, (_, i): [number, number] => [(i % 8) * 0.45, i % 2 === 0 ? 0 : 0.2]);
		await grid.dragSteps('a', [...sweep, [0, 2]], { fast: true });

		expect(at(grid, 'a')).toEqual({ x: 0, y: 2 });
		expect(['b', 'c', 'd'].map((id) => at(grid, id))).toEqual([
			{ x: 1, y: 0 },
			{ x: 2, y: 0 },
			{ x: 3, y: 0 }
		]);
		expect(problems(grid)).toEqual([]);
	});

	test('a drag far outside the grid on every side keeps every item inside', async () => {
		const grid = await mountShift([item('a', 1, 1), item('b', 2, 1)]);
		await grid.dragSteps(
			'a',
			[
				[-50, -50],
				[80, -3],
				[80, 90],
				[-60, 40],
				[0.6, 0]
			],
			{ fast: true }
		);

		expect(problems(grid)).toEqual([]);
		for (const it of grid.component.snapshot()) expect(Number.isInteger(it.x) && Number.isInteger(it.y)).toBe(true);
	});

	test('removing the dragged item mid-drag leaves a valid layout and no lingering drag target', async () => {
		const grid = await mountShift([item('a', 0, 0), item('b', 1, 0)]);
		await grid.dragSteps('a', [[0.7, 0], [1, 0], () => grid.component.remove('a')]);
		grid.component.add(item('n', 1, 0));
		await grid.settle();

		expect(problems(grid)).toEqual([]);
		// The drag never dropped: b goes back to its cell, so n takes the nearest free one.
		expect(at(grid, 'b')).toEqual({ x: 1, y: 0 });
		expect(at(grid, 'n')).toEqual({ x: 0, y: 0 });
	});

	test('a cancelled pointer ends the drag without a drop and puts items that made way back', async () => {
		const grid = await mountShift([item('a', 0, 0), item('b', 1, 0), item('c', 2, 0)]);
		await grid.dragSteps('a', [
			[0.7, 0],
			[1, 0],
			() => {
				cancelPointer();
			},
			[3, 3]
		]);

		expect(grid.component.snapshot()).toEqual([item('a', 0, 0), item('b', 1, 0), item('c', 2, 0)]);
		grid.component.add(item('n', 1, 1));
		await grid.settle();
		expect(at(grid, 'n')).toEqual({ x: 1, y: 1 });
	});

	test('a press without a move changes nothing and releases the drag target', async () => {
		const grid = await mountShift([item('a', 0, 0), item('b', 1, 0)]);
		await grid.dragSteps('a', []);
		grid.component.add(item('n', 2, 0));
		await grid.settle();

		expect(grid.component.snapshot()).toEqual([item('a', 0, 0), item('b', 1, 0), item('n', 2, 0)]);
	});

	test('switching to push mid-drag and back leaves no drag target behind', async () => {
		const grid = await mountShift([item('a', 0, 0)]);
		await grid.dragSteps('a', [[2, 0], () => grid.component.setGrid({ collision: 'push' }), [2, 1]]);
		grid.component.setGrid({ collision: 'shift' });
		await grid.settle();
		grid.component.add(item('n', 2, 0));
		await grid.settle();

		expect(at(grid, 'n')).toEqual({ x: 2, y: 0 });
		expect(problems(grid)).toEqual([]);
	});

	test('an item as wide as the grid dragged down over others pushes them below it', async () => {
		const grid = await mountShift([{ ...item('wide', 0, 0), w: 4 }, item('b', 0, 1), item('c', 3, 1)]);
		await grid.dragPath('wide', [
			[0, 0.6],
			[0, 1]
		]);

		expect(at(grid, 'wide')).toEqual({ x: 0, y: 1 });
		expect(at(grid, 'b').y).toBeGreaterThanOrEqual(2);
		expect(at(grid, 'c').y).toBeGreaterThanOrEqual(2);
		expect(problems(grid)).toEqual([]);
	});
});
