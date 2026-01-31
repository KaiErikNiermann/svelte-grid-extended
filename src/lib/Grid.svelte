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
	import { setContext, onMount, type Snippet } from 'svelte';

	import { assertGridOptions } from './utils/assert';
	import { findGridSize } from './utils/breakpoints';
	import { getGridDimensions } from './utils/grid';
	import { GridController } from '$lib/GridController';

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

	let _cols = $state(0);
	let _rows = $state(0);
	let maxCols = $state(Infinity);
	let maxRows = $state(Infinity);
	let shouldExpandRows = $state(false);
	let shouldExpandCols = $state(false);
	let gridItemSize = $state<ItemSize | undefined>(undefined);

	const calculatedGridSize = $derived(getGridDimensions(Object.values(items)));

	$effect(() => {
		if (typeof cols === 'number') _cols = cols;
	});

	$effect(() => {
		if (typeof rows === 'number') _rows = rows;
	});

	$effect(() => {
		if (itemSize?.width && itemSize?.height) {
			gridItemSize = { ...itemSize } as ItemSize;
		}
	});

	$effect(() => {
		_cols = shouldExpandCols ? calculatedGridSize.cols : _cols;
		maxCols = shouldExpandCols ? Infinity : _cols;
	});

	$effect(() => {
		_rows = shouldExpandRows ? calculatedGridSize.rows : _rows;
		maxRows = shouldExpandRows ? Infinity : _rows;
	});

	$effect(() => {
		if (collision !== 'none') {
			_rows = 0;
		}
	});

	const containerWidth = $derived.by(() => {
		if (gridItemSize && cols === 0) {
			return _cols * (gridItemSize.width + gap + 1);
		}
		return null;
	});

	const containerHeight = $derived.by(() => {
		if (gridItemSize && rows === 0) {
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

			_cols = findGridSize(cols, width, breakpoints);
			_rows = findGridSize(rows, height, breakpoints);

			shouldExpandCols = _cols === 0;
			shouldExpandRows = _rows === 0;

			gridItemSize = {
				width: itemSize.width ?? (width - (_cols + 1) * gap) / _cols,
				height: itemSize.height ?? (height - (_rows + 1) * gap) / _rows
			};
		});

		sizeObserver.observe(gridContainer);

		return () => sizeObserver.disconnect();
	});

	function registerItem(item: LayoutItem): void {
		if (item.id in items) {
			throw new Error(`Item with id ${item.id} already exists`);
		}
		items[item.id] = item;
		updateGrid();
	}

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
</script>

<div
	class={`svelte-grid-extended ${classes}`}
	bind:this={gridContainer}
	style={`width: ${containerWidth ? `${containerWidth}px` : '100%'}; 
	height: ${containerHeight ? `${containerHeight}px` : '100%'}; ${style}`}
>
	{#if gridItemSize}
		{@render children?.()}
	{/if}
</div>

<style>
	.svelte-grid-extended {
		position: relative !important;
	}
</style>
