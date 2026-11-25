import type { Placement, Size } from '../../../src/lib/types';

/** One item as the layout fixture holds it; `x`/`y` may be missing to test auto-placement. */
export type LayoutSpec = {
	id: string;
	x?: number;
	y?: number;
	w: number;
	h: number;
	min?: Size;
	max?: Size;
	movable?: boolean;
	resizable?: boolean;
	placement?: Placement;
	/** Renders a 30px header at the top of the item, a child to click or drag by. */
	header?: boolean;
};
