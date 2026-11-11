// App-grid style displacement for a drag: the dragged item may hover over others, and an item
// it covers enough of moves out of the way, away from the side the drag approached from. The
// layout is recomputed from the drag-start snapshot on every move, so items return once the
// drag moves on, and only the drop keeps the result.

export type Cell = { x: number; y: number };
export type Rect = Cell & { w: number; h: number };
export type Placed = Rect & { id: string };
export type Direction = 'left' | 'right' | 'up' | 'down';

export type DisplaceLimits = { cols: number; rows: number };

/** Coverage at which an item starts to move, and the lower one at which it moves back. */
export const ENTER_COVERAGE = 0.5;
export const LEAVE_COVERAGE = 0.3;

export type DragState = {
	/** Ids displaced on the previous move, for hysteresis. */
	displaced: ReadonlySet<string>;
	/** Where the dragged item was last placed, kept while the pointer hovers over a blocker. */
	target: Cell;
	/** Positions of every other item for `target`. */
	layout: ReadonlyMap<string, Cell>;
};

export type DisplaceResult = DragState & { changed: boolean };

const overlapLength = (a0: number, a1: number, b0: number, b1: number) =>
	Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/** $\text{coverage} = \frac{|A \cap B|}{\min(|A|, |B|)}$, so a small item over a large one can still reach 1. */
export function coverage(a: Rect, b: Rect): number {
	const area = overlapLength(a.x, a.x + a.w, b.x, b.x + b.w) * overlapLength(a.y, a.y + a.h, b.y, b.y + b.h);
	return area / Math.min(a.w * a.h, b.w * b.h);
}

export const overlaps = (a: Rect, b: Rect) => coverage(a, b) > 0;

/** The side `other` should move to: away from the dragged item's centre, along the axis of least overlap. */
export function directionAway(dragged: Rect, other: Rect): Direction {
	const dx = other.x + other.w / 2 - (dragged.x + dragged.w / 2);
	const dy = other.y + other.h / 2 - (dragged.y + dragged.h / 2);
	// Push along the axis the two overlap less on (the minimum translation axis), so a wide
	// item coming down onto a small one pushes it down, not sideways. Without an overlap, the
	// axis with the larger centre offset decides.
	const ox = overlapLength(dragged.x, dragged.x + dragged.w, other.x, other.x + other.w);
	const oy = overlapLength(dragged.y, dragged.y + dragged.h, other.y, other.y + other.h);
	const horizontal = ox > 0 && oy > 0 ? ox <= oy : Math.abs(dx) >= Math.abs(dy);
	if (horizontal) return dx >= 0 ? 'right' : 'left';
	return dy >= 0 ? 'down' : 'up';
}

/** The cell just past `from` in `dir`, wrapping to the next or previous row at a side edge. */
function stepPast(item: Rect, from: Rect, dir: Direction, limits: DisplaceLimits): Cell | null {
	switch (dir) {
		case 'right': {
			const x = from.x + from.w;
			if (x + item.w <= limits.cols) return { x, y: item.y };
			return { x: 0, y: item.y + item.h };
		}
		case 'left': {
			const x = from.x - item.w;
			if (x >= 0) return { x, y: item.y };
			return item.y - item.h >= 0 ? { x: limits.cols - item.w, y: item.y - item.h } : null;
		}
		case 'down': {
			const y = from.y + from.h;
			return y + item.h <= limits.rows ? { x: item.x, y } : { x: item.x, y: 0 };
		}
		case 'up': {
			const y = from.y - item.h;
			return y >= 0 ? { x: item.x, y } : null;
		}
	}
}

const inside = (r: Rect, limits: DisplaceLimits) =>
	r.x >= 0 && r.y >= 0 && r.x + r.w <= limits.cols && r.y + r.h <= limits.rows;

/** The cells at Chebyshev distance `r` from `near`, row by row. */
function* ring(near: Cell, r: number): Generator<Cell> {
	for (let y = near.y - r; y <= near.y + r; y++) {
		const edge = y === near.y - r || y === near.y + r;
		// Inner rows of a ring hold only its left and right cells.
		const xs = edge ? Array.from({ length: 2 * r + 1 }, (_, i) => near.x - r + i) : [near.x - r, near.x + r];
		for (const x of r === 0 ? [near.x] : xs) yield { x, y };
	}
}

/** The free cell closest to `near` (Chebyshev rings, then reading order), or null when the grid is full. */
export function nearestFree(item: Rect, near: Cell, taken: Rect[], limits: DisplaceLimits): Cell | null {
	const bottom = Math.max(near.y, ...taken.map((t) => t.y + t.h)) + item.h;
	const max = { x: limits.cols - item.w, y: Math.min(limits.rows - item.h, bottom) };
	const reach = Math.max(near.x, max.x - near.x, near.y, max.y - near.y);
	for (let r = 0; r <= reach; r++) {
		for (const cell of ring(near, r)) {
			const fits = cell.x >= 0 && cell.y >= 0 && cell.x <= max.x && cell.y <= max.y;
			if (fits && !taken.some((t) => overlaps({ ...item, ...cell }, t))) return cell;
		}
	}
	return null;
}

/**
 * Where a bumped item goes: one step past `past` in `dir`, or the nearest free cell when that
 * step leaves the grid, lands on the dragged item, or the item has been bumped too often.
 */
function bumpedCell(
	current: Rect,
	step: { past: Rect; dir: Direction; allowed: boolean },
	dragged: Rect,
	taken: () => Rect[],
	limits: DisplaceLimits
): Cell | null {
	const next = step.allowed ? stepPast(current, step.past, step.dir, limits) : null;
	if (next && inside({ ...current, ...next }, limits) && !overlaps({ ...current, ...next }, dragged)) return next;
	return nearestFree(current, current, taken(), limits);
}

const isValidLayout = (placed: Rect[], dragged: Rect, limits: DisplaceLimits) =>
	placed.every(
		(a, i) => inside(a, limits) && !overlaps(a, dragged) && placed.every((b, j) => j <= i || !overlaps(a, b))
	);

/**
 * Lays the other items out around `dragged` at `target`, starting from their drag-start
 * positions. Items under the target move away from `approach` (the dragged item's live,
 * fractional position); items they land on move on in the same direction. An item that has
 * nowhere to go that way, or keeps being bumped, takes the nearest free cell. Returns null when
 * no valid layout exists (a full fixed-size grid).
 */
export function layoutAround(
	snapshot: Placed[],
	dragged: Rect,
	approach: Rect,
	limits: DisplaceLimits
): Map<string, Cell> | null {
	const pos = new Map(snapshot.map((s) => [s.id, { x: s.x, y: s.y }]));
	const rect = (s: Placed): Placed => ({ ...s, ...pos.get(s.id)! });
	const bumps = new Map<string, number>();
	const queue: { item: Placed; past: Rect; dir: Direction }[] = snapshot
		.filter((s) => overlaps(s, dragged))
		.map((s) => ({ item: s, past: dragged, dir: directionAway(approach, s) }));
	// Each item steps at most this often; after that it takes the nearest free cell, which
	// bumps nothing, so the queue drains.
	const maxBumps = snapshot.length + 1;

	while (queue.length > 0) {
		const { item, past, dir } = queue.shift()!;
		const current = rect(item);
		if (!overlaps(current, past)) continue;
		const count = (bumps.get(item.id) ?? 0) + 1;
		bumps.set(item.id, count);
		const taken = () => [dragged, ...snapshot.filter((s) => s.id !== item.id).map((s) => rect(s))];
		const next = bumpedCell(current, { past, dir, allowed: count <= maxBumps }, dragged, taken, limits);
		if (!next) return null;
		pos.set(item.id, next);
		const moved = rect(item);
		for (const other of snapshot) {
			if (other.id !== item.id && overlaps(rect(other), moved)) queue.push({ item: other, past: moved, dir });
		}
	}

	return isValidLayout(
		snapshot.map((s) => rect(s)),
		dragged,
		limits
	)
		? pos
		: null;
}

/** Ids of the snapshot items the dragged item covers enough of to displace, with hysteresis. */
export function displacedBy(snapshot: Placed[], approach: Rect, previous: ReadonlySet<string>): Set<string> {
	return new Set(
		snapshot
			.filter((s) => coverage(approach, s) >= (previous.has(s.id) ? LEAVE_COVERAGE : ENTER_COVERAGE))
			.map((s) => s.id)
	);
}

/**
 * One drag move: `approach` is the dragged item's live fractional position, `target` the cell it
 * snaps to. The target is taken when every item under it is displaced; otherwise the dragged
 * item hovers and the previous state stays.
 */
export function displaceStep(
	snapshot: Placed[],
	dragged: { w: number; h: number },
	approach: Cell,
	target: Cell,
	state: DragState,
	limits: DisplaceLimits
): DisplaceResult {
	const approachRect = { ...dragged, ...approach };
	const targetRect = { ...dragged, ...target };
	const displaced = displacedBy(snapshot, approachRect, state.displaced);
	const blocked = snapshot.some((s) => overlaps(s, targetRect) && !displaced.has(s.id));
	const unchanged = target.x === state.target.x && target.y === state.target.y;
	if (blocked || (unchanged && sameSet(displaced, state.displaced))) {
		return { ...state, displaced, changed: false };
	}
	const layout = layoutAround(snapshot, targetRect, approachRect, limits);
	if (!layout) return { ...state, displaced, changed: false };
	return { displaced, target, layout, changed: true };
}

const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) => a.size === b.size && [...a].every((x) => b.has(x));
