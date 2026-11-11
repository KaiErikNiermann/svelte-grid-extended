import { describe, expect, test } from 'vitest';

import { FIXED_SIZE, MODES, item, mountLayout, useLayoutHarness } from './layout-harness';

useLayoutHarness();

const at = (grid: ReturnType<typeof mountLayout>, id: string) => grid.component.snapshot().find((i) => i.id === id);

describe('size constraints', () => {
	test.each(MODES)('a resize stops at max (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 6, collision, ...FIXED_SIZE },
			items: [{ ...item('a', 0, 0), max: { w: 2, h: 2 } }]
		});
		await grid.settle();
		await grid.resize('a', 4, 4);
		expect(at(grid, 'a')).toMatchObject({ w: 2, h: 2 });
	});

	test.each(MODES)('a resize stops at min (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 6, collision, ...FIXED_SIZE },
			items: [{ ...item('a', 0, 0, 3, 3), min: { w: 2, h: 2 } }]
		});
		await grid.settle();
		await grid.resize('a', -3, -3);
		expect(at(grid, 'a')).toMatchObject({ w: 2, h: 2 });
	});
});

describe('movable and resizable', () => {
	test.each(MODES)('a drag does not move an item with movable=false (%s)', async (collision) => {
		const grid = mountLayout({
			grid: { cols: 6, collision, ...FIXED_SIZE },
			items: [{ ...item('a', 0, 0), movable: false }]
		});
		await grid.settle();
		await grid.drag('a', 3, 0);
		expect(at(grid, 'a')).toMatchObject({ x: 0, y: 0 });
	});

	test('an item with resizable=false has no resize handle', async () => {
		const grid = mountLayout({ grid: { cols: 6, ...FIXED_SIZE }, items: [{ ...item('a', 0, 0), resizable: false }] });
		await grid.settle();
		expect(grid.container.querySelector('.it-a .resizer-default')).toBeNull();
	});

	test.each(MODES)('readOnly stops drags and resizes (%s)', async (collision) => {
		const grid = mountLayout({ grid: { cols: 6, collision, readOnly: true, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		await grid.drag('a', 3, 0);
		expect(at(grid, 'a')).toMatchObject({ x: 0, y: 0, w: 1, h: 1 });
		expect(grid.container.querySelector('.it-a .resizer-default')).toBeNull();
	});
});
