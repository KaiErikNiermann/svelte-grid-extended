<script lang="ts" module>
	import { getContext } from 'svelte';
	import type { GridParams } from './types';

	const GRID_CONTEXT_NAME = Symbol('svelte-grid-extended-context');

	export function getGridContext(): { current: GridParams } {
		const context = getContext<{ current: GridParams }>(GRID_CONTEXT_NAME);
		if (context === undefined) {
			throw new Error(
				`<GridItem /> is missing a parent <Grid /> component. Make sure you are using the component inside a <Grid />.`
			);
		}
		return context;
	}
</script>

<script lang="ts">
	import { setContext, onMount, untrack, type Snippet } from 'svelte';

	import { assertGridOptions } from './utils/assert';
	import { findGridSize } from './utils/breakpoints';
	import { offscreenCss } from './utils/offscreen';
	import { getGridDimensions, hasCollisions } from './utils/grid';
	import { nearestFree, overlaps, type Placed } from './utils/displace';
	import {
		assignBox,
		clampToLimits,
		hasPosition,
		pushAside,
		relocateIfColliding,
		type Box,
		type Limits
	} from './utils/placement';
	import { GridController } from './GridController';

	import type {
		Breakpoints,
		ItemSize,
		GridSize,
		LayoutItem,
		LayoutChangeDetail,
		Collision,
		GridController as GridControllerType
	} from './types';

	type Props = {
		/**
		 * Number of columns. `0` grows with the content, and then `itemSize.width` is required. A
		 * breakpoint map (`{ xs: 2, md: 4, lg: 6 }`) takes the value whose breakpoint width is
		 * closest to the container's width.
		 * @default 0
		 */
		cols?: GridSize;
		/**
		 * Number of rows, like `cols`. Ignored with `collision` `push`, `compress` or `shift`,
		 * which always grow downwards.
		 * @default 0
		 */
		rows?: GridSize;
		/**
		 * Cell size in pixels. A side that is left out is measured from the container. A given
		 * width or height also fixes the grid's size on that axis.
		 * @default {}
		 */
		itemSize?: Partial<ItemSize>;
		/**
		 * Gap between cells, in pixels.
		 * @default 10
		 */
		gap?: number;
		/**
		 * Container widths, in pixels, for the keys of a `cols` or `rows` breakpoint map.
		 * @default { xxl: 1536, xl: 1280, lg: 1024, md: 768, sm: 640, xs: 320 }
		 */
		breakpoints?: Breakpoints;
		/**
		 * Keeps dragged items inside the grid's container.
		 * @default false
		 */
		bounds?: boolean;
		/**
		 * Turns off dragging and resizing for every item.
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Reserved; it currently has no effect.
		 * @default false
		 */
		debug?: boolean;
		/** CSS class for the grid container. */
		class?: string;
		/** Inline style for the grid container. */
		style?: string;
		/**
		 * What happens when items would overlap: `none` allows it, `push` moves the other items to
		 * the first free cell, `compress` packs every item upwards, and `shift` makes items step
		 * aside during a drag the way icons do on a phone home screen.
		 * @default 'none'
		 */
		collision?: Collision;
		/**
		 * With `collision="compress"`, compresses after changes made through props, once per
		 * microtask. Turn it off to compress only when you call `controller.compress()`.
		 * @default true
		 */
		autoCompress?: boolean;
		/**
		 * Lets the browser skip rendering the grid while it is away from the viewport
		 * (`content-visibility: auto`), which keeps scrolling smooth on pages with many grids. It
		 * clips whatever items draw outside the grid and makes the grid the containing block of
		 * `position: fixed` content in it (popovers and dialogs in the top layer are not affected),
		 * so set it to `false` for a grid whose items show menus or tooltips past its edges. It is
		 * off during a drag or resize either way.
		 * @default true
		 */
		skipOffscreen?: boolean;
		/**
		 * How long, in milliseconds, a finger or pen has to be held on an item before a drag
		 * starts, so that a swipe across the grid still scrolls the page. A finger that moves
		 * during the wait scrolls instead. `0` drags at once, and the items then cannot be used
		 * to scroll. A mouse always drags at once, and so does a touch on a handle with
		 * `touch-action: none`, such as the default resize handle.
		 * @default 300
		 */
		touchDelay?: number;
		/** Bind to it (`bind:controller`) for `getFirstAvailablePosition` and `compress`. */
		controller?: GridControllerType;
		/** Called when any item's position or size changes. */
		onchange?: (detail: LayoutChangeDetail) => void;
		/** The grid's items: `GridItem` components. */
		children?: Snippet;
	};

	let {
		cols = 0,
		rows = 0,
		itemSize = {},
		gap = 10,
		breakpoints = {
			xxl: 1536,
			xl: 1280,
			lg: 1024,
			md: 768,
			sm: 640,
			xs: 320
		},
		bounds = false,
		readOnly = false,
		debug = false,
		class: classes = '',
		style = '',
		collision = 'none',
		autoCompress = true,
		skipOffscreen = true,
		touchDelay = 300,
		controller = $bindable(),
		onchange,
		children
	}: Props = $props();

	let items: Record<string, LayoutItem> = $state({});

	$effect(() => {
		assertGridOptions({ cols, rows, itemSize, collision });
	});

	// What the ResizeObserver resolved breakpoint-based sizes to; unused when the prop is a number.
	let observedCols = $state<number | undefined>();
	let observedRows = $state<number | undefined>();
	let gridItemSize = $state<ItemSize | undefined>();

	// Every limit below is derived rather than written by effects: an effect that wrote `_rows`
	// was clobbered by the resize its own growth caused, so a growing grid fell back to `100%`
	// and items overflowed it until the next interaction recomputed the size.
	// `0` means "grow with the content"; `undefined` means breakpoints are not measured yet.
	const resolvedCols = $derived(typeof cols === 'number' ? cols : observedCols);
	// Push and compress always grow downwards: `rows` is documented as ignored there.
	const resolvedRows = $derived.by(() => {
		if (collision !== 'none') return 0;
		return typeof rows === 'number' ? rows : observedRows;
	});

	// The box a drag or resize in progress is heading for. The grid grows to show it, so the
	// preview never hangs outside the container before the drop. In shift mode it also counts
	// as taken: an item added or moved there mid-drag goes to the nearest free cell instead of
	// ending up under the drop.
	let dragTarget = $state<Placed | null>(null);

	const calculatedGridSize = $derived(
		getGridDimensions(dragTarget ? [...Object.values(items), dragTarget] : Object.values(items))
	);

	const maxCols = $derived(resolvedCols || Infinity);
	const maxRows = $derived(resolvedRows || Infinity);
	const _cols = $derived(resolvedCols || calculatedGridSize.cols);
	const _rows = $derived(resolvedRows || calculatedGridSize.rows);

	$effect(() => {
		if (itemSize?.width && itemSize?.height) {
			gridItemSize = { ...itemSize } as ItemSize;
		}
	});

	// A given cell size fixes the grid's pixel size: $\text{cols} \cdot (\text{width} + gap + 1)$,
	// for a grid that grows with its content as for one with fixed cols/rows. Without one, the
	// cells are measured from the container, which the grid then fills.
	const containerWidth = $derived(itemSize?.width ? _cols * (itemSize.width + gap + 1) : null);
	const containerHeight = $derived(itemSize?.height ? _rows * (itemSize.height + gap + 1) : null);

	let gridContainer: HTMLDivElement;

	function updateGrid() {
		retryUnplaced();

		if (autoCompress && collision === 'compress') scheduleCompress();
	}

	let compressQueued = false;
	let destroyed = false;

	/**
	 * Compresses once per microtask, however many changes asked for it. Compressing on every
	 * change made a burst of N registrations or removals cost N passes of $O(n^2)$ each, and
	 * destroying a compress grid ran one pass per item for a grid about to disappear: 150
	 * items took over 10 s to unmount in jsdom.
	 */
	function scheduleCompress(): void {
		if (compressQueued) return;
		compressQueued = true;
		queueMicrotask(() => {
			compressQueued = false;
			if (!destroyed && autoCompress && collision === 'compress') _controller._internalCompress(items);
		});
	}

	onMount(() => {
		const sizeObserver = new ResizeObserver((entries) => {
			if (entries.length > 1) {
				throw new Error('that observer must have only one entry');
			}
			const entry = entries[0];

			const width = entry.contentRect.width;
			const height = entry.contentRect.height;

			observedCols = findGridSize(cols, width, breakpoints);
			observedRows = findGridSize(rows, height, breakpoints);

			const fitCols = resolvedCols ?? 0;
			const fitRows = resolvedRows ?? 0;
			gridItemSize = {
				width: itemSize.width ?? (width - (fitCols + 1) * gap) / fitCols,
				height: itemSize.height ?? (height - (fitRows + 1) * gap) / fitRows
			};
		});

		sizeObserver.observe(gridContainer);

		return () => {
			destroyed = true;
			sizeObserver.disconnect();
		};
	});

	const limits = (): Limits => ({ maxCols, maxRows });

	// Items the grid had to leave overlapping because a fixed-size grid had no free cell.
	// Overlaps set by props are not tracked: `none` mode allows them.
	const unplaced = new Set<string>();

	/** Records `item` as unplaced when the position the grid chose for it still overlaps. */
	function trackPlacement(item: LayoutItem): void {
		if (hasCollisions(item, Object.values(items))) unplaced.add(item.id);
		else unplaced.delete(item.id);
	}

	/** Moves unplaced items into a cell that has freed up since (removal, resize, more columns). */
	function retryUnplaced(): void {
		// A snapshot: the loop re-adds items that still do not fit, which a live Set would revisit.
		for (const id of new Set(unplaced)) {
			unplaced.delete(id);
			const it = items[id];
			if (!it) continue;
			const others = Object.values(items);
			const box = relocateIfColliding(it, it, others, limits());
			if (hasCollisions({ ...it, ...box }, others)) {
				unplaced.add(id);
			} else if (assignBox(it, box)) {
				it.invalidate();
			}
		}
	}

	/**
	 * Fits a new item into the grid before it joins: an item past the fixed limits is clamped
	 * inside, and one without `x`/`y` gets the first free cell. Either move avoids landing on
	 * another item. In push mode a new item declared on an occupied cell also moves to the first
	 * free cell, rather than pushing the items already there; compress resolves the overlap by
	 * compressing, and `none` allows it. Otherwise an item that fits is left exactly as given.
	 * Returns whether the item changed, so its bindings can be updated.
	 */
	function placeNewItem(item: LayoutItem): boolean {
		const positioned = hasPosition(item);
		const box = clampToLimits(positioned ? item : { ...item, x: 0, y: 0 }, limits());
		const moved = !positioned || box.x !== item.x || box.y !== item.y;
		if (collision === 'shift') {
			const changed = assignBox(item, moved || overlapsTaken({ ...item, ...box }) ? nearestFreeBox(item, box) : box);
			trackPlacement(item);
			return changed;
		}
		if (!moved && collision !== 'push') return assignBox(item, box);
		const others = Object.values(items);
		// The common push case, an item declared on a free cell, costs one scan and no tracking.
		if (!moved && !hasCollisions({ ...item, ...box }, others)) return assignBox(item, box);
		const changed = assignBox(item, relocateIfColliding(item, box, others, limits()));
		trackPlacement(item);
		return changed;
	}

	/** The item whose drag or resize runs now; the grid's layout logic assumes one at a time. */
	let gestureOwner: string | null = null;

	function claimGesture(id: string): boolean {
		if (gestureOwner !== null && gestureOwner !== id) return false;
		gestureOwner = id;
		return true;
	}

	function releaseGesture(id: string): void {
		if (gestureOwner === id) gestureOwner = null;
	}

	function setDragTarget(target: Placed | null): void {
		dragTarget = target;
	}

	/** Everything `item` must keep off in shift mode: the other items and the drag target. */
	function takenFor(item: LayoutItem): Placed[] {
		const others: Placed[] = Object.values(items).filter((other) => other.id !== item.id);
		return dragTarget && dragTarget.id !== item.id ? [...others, dragTarget] : others;
	}

	const overlapsTaken = (item: LayoutItem) => takenFor(item).some((taken) => overlaps(item, taken));

	/** The free cell nearest to `box`, or `box` itself when the grid has none. */
	function nearestFreeBox(item: LayoutItem, box: Box): Box {
		const free = nearestFree({ ...item, ...box }, box, takenFor(item), { cols: maxCols, rows: maxRows });
		return free ? { ...box, ...free } : box;
	}

	function registerItem(item: LayoutItem): void {
		if (item.id in items) {
			throw new Error(`Item with id ${item.id} already exists`);
		}
		const changed = placeNewItem(item);
		items[item.id] = item;
		if (changed) {
			item.invalidate();
		} else {
			updateGrid();
		}
	}

	/**
	 * Re-validates an item whose x/y/w/h changed from outside a drag, or at the end of one:
	 * it is clamped into the limits, and in push and compress mode the items it now covers
	 * are pushed aside, the same rule a drag follows. `none` mode applies the props as given.
	 */
	function settleItem(item: LayoutItem): void {
		let changed = assignBox(item, clampToLimits(item, limits()));
		if (collision === 'shift' && dragTarget && dragTarget.id !== item.id && overlaps(item, dragTarget)) {
			changed = assignBox(item, nearestFreeBox(item, item)) || changed;
		}
		if (collision !== 'none') {
			for (const other of pushAside(item, Object.values(items), limits())) other.invalidate();
		}
		if (changed) {
			item.invalidate();
		} else {
			updateGrid();
		}
	}

	/** Moves items that a smaller grid (fewer columns, a new breakpoint) left outside it. */
	function reflow(bounds: Limits): void {
		const ordered = Object.values(items).sort((a, b) => a.y - b.y || a.x - b.x);
		for (const it of ordered) {
			const box = clampToLimits(it, bounds);
			if (box.x === it.x && box.y === it.y && box.w === it.w && box.h === it.h) continue;
			if (collision === 'none') {
				assignBox(it, relocateIfColliding(it, box, Object.values(items), bounds));
				trackPlacement(it);
			} else {
				assignBox(it, box);
				for (const other of pushAside(it, Object.values(items), bounds)) other.invalidate();
			}
			it.invalidate();
		}
		retryUnplaced();
	}

	$effect(() => {
		const bounds = { maxCols, maxRows };
		untrack(() => reflow(bounds));
	});

	/**
	 * Brings the layout in line with a newly chosen mode: overlaps that `none` allowed are
	 * pushed apart in reading order, and compress mode compresses.
	 */
	function adoptMode(mode: Collision): void {
		if (mode === 'none') return;
		const ordered = Object.values(items).sort((a, b) => a.y - b.y || a.x - b.x);
		for (const it of ordered) {
			for (const other of pushAside(it, Object.values(items), limits())) other.invalidate();
		}
		updateGrid();
	}

	// Only a change of mode needs the pass: at mount, placement already keeps the mode's rules,
	// and a full pass over every pair of items made a 200-item push grid mount 15% slower.
	let adoptedMode: Collision | undefined;
	$effect(() => {
		const mode = collision;
		if (adoptedMode !== undefined && adoptedMode !== mode) untrack(() => adoptMode(mode));
		adoptedMode = mode;
	});

	function unregisterItem(item: LayoutItem): void {
		delete items[item.id];
		unplaced.delete(item.id);
		updateGrid();
	}

	function handleChange(detail: LayoutChangeDetail): void {
		onchange?.(detail);
	}

	// Create a reactive object that can be accessed from context
	const gridSettings = $derived<GridParams>({
		cols: _cols,
		rows: _rows,
		maxCols,
		maxRows,
		gap,
		itemSize: gridItemSize,
		items,
		bounds,
		boundsTo: gridContainer!,
		readOnly,
		debug,
		collision,
		touchDelay,
		claimGesture,
		releaseGesture,
		registerItem,
		unregisterItem,
		settleItem,
		setDragTarget,
		updateGrid,
		onchange: handleChange
	});

	// Use a getter-based context object for proper reactivity
	// The getter ensures we always get the current derived value
	const contextRef = {
		get current() {
			return gridSettings;
		}
	};

	const _controller = new GridController(contextRef);

	controller = _controller as GridControllerType;

	setContext(GRID_CONTEXT_NAME, contextRef);

	// The browser may skip rendering the grid away from the viewport; see offscreenCss. Not during
	// a drag or resize, whose item may be drawn outside the grid.
	const skipping = $derived(skipOffscreen && dragTarget === null);

	const containerCss = $derived.by(() => {
		const width = containerWidth ? `${containerWidth}px` : '100%';
		const height = containerHeight ? `${containerHeight}px` : '100%';
		return `width: ${width}; height: ${height}; ${offscreenCss(skipping)} ${style}`;
	});
</script>

<div class={`svelte-grid-extended ${classes}`} bind:this={gridContainer} style={containerCss}>
	{#if gridItemSize}
		{@render children?.()}
	{/if}
</div>

<style>
	.svelte-grid-extended {
		position: relative !important;
	}
</style>
