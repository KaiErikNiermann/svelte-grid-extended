---
title: Quick Start
description: Create your first grid layout
---

# Quick Start

This guide will help you create your first grid layout in just a few steps.

## Basic Grid

The simplest grid layout requires a `Grid` component with `cols` and `rows` props, and one or more `GridItem` components:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
</script>

<Grid cols={10} rows={10}>
	<GridItem x={0} y={0} w={2} h={2}>
		{#snippet children()}
			<div class="item">Item 1</div>
		{/snippet}
	</GridItem>
	<GridItem x={3} y={0} w={3} h={1}>
		{#snippet children()}
			<div class="item">Item 2</div>
		{/snippet}
	</GridItem>
</Grid>

<style>
	:global(.item) {
		display: grid;
		place-items: center;
		background-color: #e0e0e0;
		width: 100%;
		height: 100%;
		border-radius: 4px;
	}
</style>
```

## With State and Binding

For dynamic grids, use Svelte's `$state` and bind the item properties:

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 2, h: 5 },
		{ id: '2', x: 2, y: 2, w: 2, h: 2 }
	]);

	let gridController: GridController;

	function addNewItem() {
		const w = Math.floor(Math.random() * 2) + 1;
		const h = Math.floor(Math.random() * 5) + 1;
		const newPosition = gridController.getFirstAvailablePosition(w, h);
		if (newPosition) {
			items = [...items, { id: crypto.randomUUID(), ...newPosition, w, h }];
		}
	}

	const itemSize = { height: 40 };
</script>

<button onclick={addNewItem}>Add New Item</button>

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

## Key Concepts

### Grid Units

Items are positioned and sized in **grid units**, not pixels:

- `x` and `y` define the position (column and row)
- `w` and `h` define the size (width and height in grid cells)

### Item Size

When using `itemSize`, you define the pixel dimensions of each grid cell:

- `itemSize.width` - pixel width of each column
- `itemSize.height` - pixel height of each row

### Collision Behavior

The `collision` prop controls how items interact:

- `none` - Items can overlap (default)
- `push` - Items push others out of the way
- `compress` - Items compress vertically to fill gaps

## Next Steps

- Learn about [Grid props](../grid)
- Explore [GridItem options](../grid-item)
- See more [Examples](../examples)
