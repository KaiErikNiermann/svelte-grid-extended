import type { Collision } from '@appulsauce/svelte-grid';

export type Spec = { id: string; x?: number; y?: number; w: number; h: number };

/** A button that changes the layout the way an app would: through the items it renders. */
export type Action = { label: string; apply: (items: Spec[]) => Spec[] };

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
