---
title: Grid Controller
description: Programmatically control the grid layout
---

# Grid Controller

The Grid Controller provides methods to programmatically interact with the grid layout.

## Getting the Controller

Bind to the `controller` prop on the Grid component:

```svelte
<script lang="ts">
	import Grid, { type GridController } from '@appulsauce/svelte-grid';

	let gridController: GridController;
</script>

<Grid bind:controller={gridController} cols={10}>
	<!-- items -->
</Grid>
```

## Methods

### getFirstAvailablePosition(w, h)

Finds the first available position that can fit an item of the specified size.

**Parameters:**

- `w` (number): Width of the item in grid units
- `h` (number): Height of the item in grid units

**Returns:**

- `{ x: number, y: number }` - The first available position
- `null` - If no position is available (only when grid has fixed rows)

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@appulsauce/svelte-grid';

	let items = $state([{ id: '1', x: 0, y: 0, w: 2, h: 2 }]);

	let gridController: GridController;

	function addItem() {
		const position = gridController.getFirstAvailablePosition(2, 2);
		if (position) {
			items = [
				...items,
				{
					id: crypto.randomUUID(),
					x: position.x,
					y: position.y,
					w: 2,
					h: 2
				}
			];
		}
	}

	const itemSize = { height: 50 };
</script>

<button onclick={addItem}>Add Item</button>

<Grid {itemSize} cols={10} collision="push" bind:controller={gridController}>
	{#each items as item (item.id)}
		<GridItem id={item.id} bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				<div class="item">{item.id.slice(0, 5)}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

### compress()

Compresses all items vertically, moving them upward to fill any gaps. This is useful after removing items or when you want to optimize the layout.

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 2, h: 2 },
		{ id: '2', x: 0, y: 5, w: 2, h: 2 } // Gap at y: 2-4
	]);

	let gridController: GridController;

	function compressGrid() {
		gridController.compress();
		// After compress, item 2 will move up to fill the gap
	}

	const itemSize = { height: 50 };
</script>

<button onclick={compressGrid}>Compress</button>

<Grid {itemSize} cols={10} collision="push" bind:controller={gridController}>
	{#each items as item (item.id)}
		<GridItem id={item.id} bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

## Auto Compress

When using `collision="compress"`, the grid automatically compresses items after programmatic changes by default. You can disable this with `autoCompress={false}`:

```svelte
<Grid collision="compress" autoCompress={false}>
	<!-- Items won't auto-compress -->
</Grid>
```

## Use Cases

### Dynamic Item Addition

```typescript
function addRandomItem() {
	const w = Math.floor(Math.random() * 3) + 1;
	const h = Math.floor(Math.random() * 3) + 1;
	const position = gridController.getFirstAvailablePosition(w, h);

	if (position) {
		items = [...items, { id: crypto.randomUUID(), ...position, w, h }];
	}
}
```

### Item Removal with Compression

```typescript
function removeItem(id: string) {
	items = items.filter((item) => item.id !== id);
	gridController.compress();
}
```
