import type { Collision } from '@appulsauce/svelte-grid';

export type Spec = { id: string; x?: number; y?: number; w: number; h: number };

/** A button that changes the layout the way an app would: through the items it renders. */
export type Action = {
	label: string;
	apply: (items: Spec[]) => Spec[];
	/** Whether the action can do anything now; the button is disabled when it cannot. */
	enabled?: (items: Spec[]) => boolean;
};

export type ScenarioSpec = {
	/** Stable id to refer to the case by, e.g. "S3"; also its anchor on the page. */
	id: string;
	title: string;
	/** What to do. */
	steps: string;
	/** What should happen, per mode when the modes differ. */
	expect: string | Partial<Record<Collision, string>>;
	modes: Collision[];
	cols: number;
	rows?: number;
	items: Spec[];
	actions?: Action[];
	/**
	 * One second after a press, an item appears (`add`) or item `b` moves (`move`) to the cell
	 * under the dragged item's outline, as if the app changed the layout mid-drag.
	 */
	duringDrag?: 'add' | 'move';
};

/**
 * An id no item has yet: `n`, then `n2`, `n3`. Items are keyed by id, and a repeated id makes
 * Svelte's keyed each and the grid's registerItem throw, so every added item needs a new one.
 */
export function freshId(items: Spec[], base = 'n'): string {
	const taken = new Set(items.map((it) => it.id));
	if (!taken.has(base)) return base;
	let i = 2;
	while (taken.has(`${base}${i}`)) i++;
	return `${base}${i}`;
}
