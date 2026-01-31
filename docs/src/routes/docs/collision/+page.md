---
title: Collision Behavior
description: How collision detection works in the grid
---

# Collision Behavior

The `collision` prop controls how the grid handles overlapping items when they are moved or resized.

## Collision Modes

### None (Default)

Setting `collision="none"` allows items to overlap freely. This is the default behavior.

```svelte
<Grid cols={10} rows={10} collision="none">
	<!-- Items can overlap each other -->
</Grid>
```

**Use cases:**
- When overlap is acceptable or desired
- For simpler use cases without dynamic rearrangement
- When you want full control over item positioning

### Push

Setting `collision="push"` causes items to move to the first available space when they would overlap.

```svelte
<script>
	const itemSize = { height: 40 };
</script>

<Grid {itemSize} cols={10} collision="push">
	<!-- Items push each other out of the way -->
</Grid>
```

**Behavior:**
- When an item is moved to a position occupied by another item, the other item moves down
- The grid grows vertically as needed to accommodate all items
- Items maintain their relative horizontal positions when possible

> **Note:** When using `collision="push"`, `rows` is automatically set to `0` (infinite), so `itemSize.height` must be provided.

### Compress

Setting `collision="compress"` compresses items vertically toward the top of the grid.

```svelte
<script>
	const itemSize = { height: 40 };
</script>

<Grid {itemSize} cols={10} collision="compress">
	<!-- Items compress upward to fill gaps -->
</Grid>
```

**Behavior:**
- Items always move to the highest available position
- Gaps are automatically filled when items are moved or removed
- Creates a compact, vertically-optimized layout

> **Note:** When using `collision="compress"`, `rows` is automatically set to `0` (infinite), so `itemSize.height` must be provided.

## Comparison

| Mode | Overlap | Auto-arrange | Best for |
|------|---------|--------------|----------|
| `none` | Yes | No | Simple layouts, manual control |
| `push` | No | Pushes down | Dashboard widgets, kanban boards |
| `compress` | No | Fills gaps | Compact layouts, masonry-style |

## Example: Push Collision

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: '0', x: 0, y: 0, w: 2, h: 5 },
		{ id: '1', x: 2, y: 2, w: 2, h: 2 },
		{ id: '2', x: 2, y: 0, w: 1, h: 2 },
		{ id: '3', x: 3, y: 0, w: 2, h: 2 },
		{ id: '4', x: 4, y: 2, w: 1, h: 3 },
		{ id: '5', x: 8, y: 0, w: 2, h: 8 }
	]);

	const itemSize = { height: 40 };
</script>

<Grid {itemSize} cols={10} collision="push">
	{#each items as item (item.id)}
		<GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

## Example: Compress Collision

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: '0', x: 0, y: 0, w: 2, h: 5 },
		{ id: '1', x: 2, y: 2, w: 2, h: 2 },
		{ id: '2', x: 2, y: 0, w: 1, h: 2 },
	]);

	const itemSize = { height: 40 };
</script>

<Grid {itemSize} cols={10} collision="compress">
	{#each items as item (item.id)}
		<GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

## Auto Compress

When using `collision="compress"`, the `autoCompress` prop controls whether items automatically compress after programmatic changes:

```svelte
<!-- Auto compress enabled (default) -->
<Grid collision="compress" autoCompress={true}>
	<!-- Items auto-compress after state changes -->
</Grid>

<!-- Auto compress disabled -->
<Grid collision="compress" autoCompress={false}>
	<!-- Manual compress via controller.compress() -->
</Grid>
```
