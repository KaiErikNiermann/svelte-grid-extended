import type { LayoutItem } from '../types';
import { getAvailablePosition, getCollisions, hasCollisions } from './grid';
import { clamp } from './item';

export type Limits = { maxCols: number; maxRows: number };
type Box = Pick<LayoutItem, 'x' | 'y' | 'w' | 'h'>;

/**
 * The closest box to `box` that fits inside the grid's fixed limits: the size is capped at
 * the limit, then the position is clamped to $[0, \text{max} - \text{size}]$. Unbounded
 * axes (`Infinity`) are left alone apart from the lower bound.
 */
export function clampToLimits(box: Box, { maxCols, maxRows }: Limits): Box {
	const w = Math.max(1, Math.min(box.w, maxCols));
	const h = Math.max(1, Math.min(box.h, maxRows));
	return { x: clamp(box.x, 0, maxCols - w), y: clamp(box.y, 0, maxRows - h), w, h };
}

/** Whether `x` and `y` are both usable coordinates (a missing prop arrives as `undefined`). */
export function hasPosition(box: Pick<LayoutItem, 'x' | 'y'>): boolean {
	return Number.isFinite(box.x) && Number.isFinite(box.y);
}

/**
 * Writes `box` into `item` and reports whether anything changed, so callers only
 * invalidate (and fire `onchange`) for real moves.
 */
export function assignBox(item: LayoutItem, box: Box): boolean {
	const changed = item.x !== box.x || item.y !== box.y || item.w !== box.w || item.h !== box.h;
	Object.assign(item, { x: box.x, y: box.y, w: box.w, h: box.h });
	return changed;
}

/**
 * Moves every item `item` now covers to the first free position, keeping `item` where it
 * is: the push rule. Items moved earlier in the loop are seen at their new position by the
 * later ones. Returns the items that moved.
 */
export function pushAside(item: LayoutItem, items: LayoutItem[], limits: Limits): LayoutItem[] {
	const moved: LayoutItem[] = [];
	for (const other of getCollisions(item, items)) {
		const rest = items.filter((i) => i.id !== other.id && i.id !== item.id);
		const position = getAvailablePosition(other, [...rest, item], limits.maxCols, limits.maxRows);
		if (position) {
			other.x = position.x;
			other.y = position.y;
			moved.push(other);
		}
	}
	return moved;
}

/**
 * `box`, or the first free position for it when it would overlap one of `items`. Used where
 * the grid itself moved an item (clamping, auto-placement), so the grid never creates an
 * overlap that the props did not ask for. An item with nowhere to go keeps `box`.
 */
export function relocateIfColliding(item: LayoutItem, box: Box, items: LayoutItem[], limits: Limits): Box {
	const candidate = { ...item, ...box };
	if (!hasCollisions(candidate, items)) return box;
	const free = getAvailablePosition(candidate, items, limits.maxCols, limits.maxRows);
	return free ? { ...box, ...free } : box;
}
