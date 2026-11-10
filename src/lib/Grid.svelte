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
	import { getGridDimensions } from './utils/grid';
	import {
		assignBox,
		clampToLimits,
		hasPosition,
		pushAside,
		relocateIfColliding,
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
		cols?: GridSize;
		rows?: GridSize;
		itemSize?: Partial<ItemSize>;
		gap?: number;
		breakpoints?: Breakpoints;
		bounds?: boolean;
		readOnly?: boolean;
		debug?: boolean;
		class?: string;
		style?: string;
		collision?: Collision;
		autoCompress?: boolean;
		controller?: GridControllerType;
		onchange?: (detail: LayoutChangeDetail) => void;
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

	const calculatedGridSize = $derived(getGridDimensions(Object.values(items)));

	const maxCols = $derived(resolvedCols || Infinity);
	const maxRows = $derived(resolvedRows || Infinity);
	const _cols = $derived(resolvedCols || calculatedGridSize.cols);
	const _rows = $derived(resolvedRows || calculatedGridSize.rows);

	$effect(() => {
		if (itemSize?.width && itemSize?.height) {
			gridItemSize = { ...itemSize } as ItemSize;
		}
	});

	const containerWidth = $derived.by(() => {
		if (gridItemSize && resolvedCols === 0) {
			return _cols * (gridItemSize.width + gap + 1);
		}
		return null;
	});

	const containerHeight = $derived.by(() => {
		if (gridItemSize && resolvedRows === 0) {
			return _rows * (gridItemSize.height + gap + 1);
		}
		return null;
	});

	let gridContainer: HTMLDivElement;

	function updateGrid() {
		items = { ...items };

		if (autoCompress && collision === 'compress') {
			_controller._internalCompress();
		}
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

		return () => sizeObserver.disconnect();
	});

	const limits = (): Limits => ({ maxCols, maxRows });

	/**
	 * Fits a new item into the grid before it joins: an item past the fixed limits is clamped
	 * inside, and one without `x`/`y` gets the first free cell. Either move avoids landing on
	 * another item. An item registered where it fits is left exactly as given.
	 * Returns whether the item changed, so its bindings can be updated.
	 */
	function placeNewItem(item: LayoutItem): boolean {
		const positioned = hasPosition(item);
		const box = clampToLimits(positioned ? item : { ...item, x: 0, y: 0 }, limits());
		const moved = !positioned || box.x !== item.x || box.y !== item.y;
		return assignBox(item, moved ? relocateIfColliding(item, box, Object.values(items), limits()) : box);
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
		const changed = assignBox(item, clampToLimits(item, limits()));
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
			} else {
				assignBox(it, box);
				for (const other of pushAside(it, Object.values(items), bounds)) other.invalidate();
			}
			it.invalidate();
		}
	}

	$effect(() => {
		const bounds = { maxCols, maxRows };
		untrack(() => reflow(bounds));
	});

	function unregisterItem(item: LayoutItem): void {
		delete items[item.id];
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
		registerItem,
		unregisterItem,
		settleItem,
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

	const containerCss = $derived.by(() => {
		const width = containerWidth ? `${containerWidth}px` : '100%';
		const height = containerHeight ? `${containerHeight}px` : '100%';
		return `width: ${width}; height: ${height}; ${style}`;
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
