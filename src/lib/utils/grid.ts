import type { GridDimensions, LayoutItem } from '../types';

export function isItemColliding(item: LayoutItem, otherItem: LayoutItem): boolean {
	return (
		item.id !== otherItem.id &&
		item.x <= otherItem.x + otherItem.w - 1 &&
		item.y <= otherItem.y + otherItem.h - 1 &&
		item.x + item.w - 1 >= otherItem.x &&
		item.y + item.h - 1 >= otherItem.y
	);
}

export function getCollisions(currentItem: LayoutItem, items: LayoutItem[]): LayoutItem[] {
	return items.filter((item) => isItemColliding(currentItem, item));
}

export function hasCollisions(currentItem: LayoutItem, items: LayoutItem[]): boolean {
	return items.some((item) => isItemColliding(currentItem, item));
}

export function getGridDimensions(items: LayoutItem[]): GridDimensions {
	let cols = 0;
	let rows = 0;

	for (const item of items) {
		cols = Math.max(cols, item.x + item.w);
		rows = Math.max(rows, item.y + item.h);
	}

	return { cols, rows };
}

export function getAvailablePosition(
	currentItem: LayoutItem,
	items: LayoutItem[],
	maxCols: number,
	maxRows: number
): { x: number; y: number } | null {
	let { cols, rows } = getGridDimensions(items);

	if (maxCols < Infinity) cols = maxCols;
	if (maxRows < Infinity) rows = maxRows;

	for (let y = 0; y <= rows - currentItem.h; y++) {
		for (let x = 0; x <= cols - currentItem.w; x++) {
			const item = { ...currentItem, x, y };

			if (!hasCollisions(item, items)) {
				const newPosition = { x, y };
				return newPosition;
			}
		}
	}

	if (maxRows === Infinity) return { x: 0, y: rows };
	if (maxCols === Infinity) return { x: cols, y: 0 };

	return null;
}

/**
 * Moving `item` up from row `fromY`, the first row where it collides with one of `items`,
 * or -1 when nothing blocks it; `blockingRow(...) + 1` is the highest row it can move to.
 * No row past every item's bottom edge can collide, so the scan starts at
 * $\min(\text{fromY},\ \max_i(y_i + h_i) - 1)$ and is bounded by the content height rather
 * than by `fromY`: an item at y = 1e6 used to take a million steps to compress. A negative
 * or non-finite `fromY` is returned as is, as the loop this replaces did.
 */
export function blockingRow(item: LayoutItem, items: LayoutItem[], fromY: number): number {
	if (Number.isNaN(fromY) || fromY < 0) return fromY;
	const bottom = items.reduce((lowest, other) => Math.max(lowest, other.y + other.h), 0);
	for (let y = Math.min(fromY, bottom - 1); y >= 0; y--) {
		if (hasCollisions({ ...item, y }, items)) return y;
	}
	return -1;
}
