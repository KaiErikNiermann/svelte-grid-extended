---
title: Static Grid
description: Fixed dimension grids with itemSize
---

# Static Grid

When `itemSize` is set along with `cols` or `rows`, the grid becomes "static" - it uses fixed pixel dimensions instead of adapting to the container.

## Basic Static Grid

Set both width and height for a fully static grid:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={10} rows={10}>
	<GridItem x={1} y={0}>
		{#snippet children()}
			<div class="item">Hey</div>
		{/snippet}
	</GridItem>
	<GridItem x={3} y={3} w={4}>
		{#snippet children()}
			<div class="item">Hoy</div>
		{/snippet}
	</GridItem>
</Grid>
```

In this example:
- Each cell is exactly 100px wide × 40px tall
- The grid is 1000px wide × 400px tall (plus gaps)

## Static Height Only

Set only `height` for static row heights with fluid column widths:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	const itemSize = { height: 40 };
</script>

<Grid {itemSize} cols={10} rows={10}>
	<GridItem x={1} y={0}>
		{#snippet children()}
			<div class="item">Fluid width</div>
		{/snippet}
	</GridItem>
</Grid>
```

In this example:
- Row heights are fixed at 40px
- Column widths adapt to the container width
- Common for dashboard layouts

## Static Width Only

Set only `width` for static column widths with fluid row heights:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	const itemSize = { width: 100 };
</script>

<Grid {itemSize} cols={10} rows={10}>
	<GridItem x={1} y={0}>
		{#snippet children()}
			<div class="item">Fluid height</div>
		{/snippet}
	</GridItem>
</Grid>
```

## Grid Without Bounds (Infinite Grid)

When `cols` or `rows` is set to `0`, the grid grows infinitely in that dimension. The grid container will expand to fit all items.

### Infinite in Both Directions

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={0} rows={0}>
	<GridItem x={0} y={0}>
		{#snippet children()}
			<div class="item">A</div>
		{/snippet}
	</GridItem>
	<GridItem x={10} y={10} w={5} h={5}>
		{#snippet children()}
			<div class="item">Far away</div>
		{/snippet}
	</GridItem>
</Grid>
```

> **Important:** When `cols` is `0`, you must set `itemSize.width`. When `rows` is `0`, you must set `itemSize.height`.

### Infinite Rows (Common for Collision Modes)

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	const itemSize = { height: 40 };
</script>

<!-- collision="push" or "compress" automatically sets rows to 0 -->
<Grid {itemSize} cols={10} collision="push">
	<GridItem x={0} y={0} w={2} h={2}>
		{#snippet children()}
			<div class="item">Item</div>
		{/snippet}
	</GridItem>
</Grid>
```

## Use Cases

| Configuration | Use Case |
|--------------|----------|
| `itemSize: { width, height }` | Fixed-size tiles, image grids |
| `itemSize: { height }` | Dashboard widgets, cards |
| `itemSize: { width }` | Horizontal scrolling layouts |
| `cols: 0` or `rows: 0` | Infinite/growing layouts |

## Example: Dashboard with Fixed Row Height

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: 'stats', x: 0, y: 0, w: 4, h: 2 },
		{ id: 'chart', x: 4, y: 0, w: 8, h: 4 },
		{ id: 'table', x: 0, y: 2, w: 4, h: 6 },
	]);

	const itemSize = { height: 50 }; // Each row is 50px
</script>

<Grid {itemSize} cols={12} gap={16} collision="push">
	{#each items as item (item.id)}
		<GridItem id={item.id} bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				<div class="h-full bg-white rounded-lg shadow p-4">
					{item.id}
				</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```
