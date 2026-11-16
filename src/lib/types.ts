import type { RequireAtLeastOne } from './utils/types';
import type { Snippet } from 'svelte';

export type LayoutItem = Size &
	Position & {
		id: string;
		min?: Size;
		max?: Size;
		movable: boolean;
		resizable: boolean;
		/** How registration treats `x`/`y` on an occupied cell; see `GridItemProps.placement`. */
		placement?: Placement;
		invalidate: () => void;
	};

/**
 * Item position in grid units
 */
export type Size = { w: number; h: number };

/**
 * Item position in grid units
 */
export type Position = { x: number; y: number };

/**
 * Item position in pixels
 */
export type ItemPosition = { left: number; top: number };

/**
 * Item size in pixels
 */
export type ItemSize = { width: number; height: number };

export type ItemChangeEvent = { id: number; x: number; y: number; w: number; h: number };

export type BreakpointKey = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

export type Breakpoints = Record<BreakpointKey, number>;

export type GridSize = number | RequireAtLeastOne<Breakpoints>;

export type GridDimensions = { cols: number; rows: number };

export type GridParams = {
	cols: number;
	rows: number;
	itemSize?: ItemSize;
	gap: number;
	maxCols: number;
	maxRows: number;
	bounds: boolean;
	boundsTo?: HTMLElement;
	items: Record<string, LayoutItem>;
	readOnly: boolean;
	debug: boolean;
	collision: Collision;
	/** How long, in ms, a finger or pen is held on an item before its drag starts; 0 starts at once. */
	touchDelay: number;
	/** Takes the grid's one gesture slot for `id`; false while another item's gesture runs. */
	claimGesture: (id: string) => boolean;
	/** Frees the gesture slot if `id` holds it. */
	releaseGesture: (id: string) => void;
	registerItem: (item: LayoutItem) => void;
	unregisterItem: (item: LayoutItem) => void;
	/** Re-validates an item whose position or size changed outside the grid's own moves. */
	settleItem: (item: LayoutItem) => void;
	/** The cell a shift-mode drag is heading for, which placement treats as taken; null ends it. */
	setDragTarget: (target: (Size & Position & { id: string }) | null) => void;
	updateGrid: () => void;
	onchange: (detail: LayoutChangeDetail) => void;
};

export type LayoutChangeDetail = {
	item: LayoutItem;
};

export type Collision = 'none' | 'push' | 'compress' | 'shift';

/**
 * How a new item's `x`/`y` are read when they land on an occupied cell: `exact` keeps them
 * (in `none` mode the items overlap), `preferred` moves the item to the nearest free cell.
 */
export type Placement = 'exact' | 'preferred';

export type GridController = {
	/** The grid's current settings and items. */
	gridParams: GridParams;
	/**
	 * The first free cell, in reading order, where an item of `w` x `h` cells fits; null when a
	 * grid with fixed `cols` and `rows` has no room.
	 */
	getFirstAvailablePosition: (w: number, h: number) => Position | null;
	/** Packs every item upwards now, whatever `autoCompress` is set to. */
	compress: () => void;
};

// Snippet types for GridItem
export type MoveHandleSnippetProps = {
	moveStart: (event: PointerEvent) => void;
};

export type ResizeHandleSnippetProps = {
	resizeStart: (event: PointerEvent) => void;
};

export type GridItemDefaultSnippetProps = {
	id: string;
	active: boolean;
	w: number;
	h: number;
};

export type GridItemProps = {
	/**
	 * Unique id within the grid; a random UUID when left out.
	 */
	id?: string;
	/** Column of the left edge, in cells. Without `x` and `y` the item takes a free cell. */
	x?: number;
	/** Row of the top edge, in cells. */
	y?: number;
	/**
	 * Width in cells. Fractions are rounded and the width is capped at a fixed `cols`.
	 * @default 1
	 */
	w?: number;
	/**
	 * Height in cells.
	 * @default 1
	 */
	h?: number;
	/**
	 * Smallest size a resize can reach, in cells.
	 * @default { w: 1, h: 1 }
	 */
	min?: Size;
	/** Largest size a resize can reach, in cells; no limit when left out. */
	max?: Size;
	/**
	 * How `x`/`y` are read when the item joins the grid on an occupied cell. `exact` keeps
	 * them, so in `none` mode the item overlaps what is there. `preferred` keeps them when the
	 * cell is free and otherwise moves the item to the free cell nearest it, leaving the other
	 * items where they are. Items that join in the same tick are placed together: each one
	 * whose cell is free gets it first, so a group revealed at once keeps every free saved
	 * cell. Only joining reads it; a later change of `x`/`y` is applied as the mode applies it.
	 * Shift mode always moves a new item to the nearest free cell, so it ignores this.
	 * @default 'exact'
	 */
	placement?: Placement;
	/**
	 * Whether the item can be dragged.
	 * @default true
	 */
	movable?: boolean;
	/**
	 * Whether the item can be resized.
	 * @default true
	 */
	resizable?: boolean;
	/** CSS class for the item. */
	class?: string;
	/** CSS class added while the item is being dragged or resized. */
	activeClass?: string;
	/** CSS class for the outline that shows where a drag or resize will land. */
	previewClass?: string;
	/** CSS class for the resize handle. */
	resizerClass?: string;
	/** Inline style for the item. */
	style?: string;
	/** Called when this item's position or size changes. */
	onchange?: (detail: LayoutChangeDetail) => void;
	/** Called when the outline moves during a drag or resize, before the drop. */
	onpreviewchange?: (detail: LayoutChangeDetail) => void;
	/** The item's content. */
	children?: Snippet<[GridItemDefaultSnippetProps]>;
	/** A custom drag handle; without one the whole item drags. */
	moveHandle?: Snippet<[MoveHandleSnippetProps]>;
	/** A custom resize handle in place of the default corner. */
	resizeHandle?: Snippet<[ResizeHandleSnippetProps]>;
};
