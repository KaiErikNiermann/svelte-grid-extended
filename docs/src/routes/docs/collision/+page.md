---
title: Collision Behavior
description: How collision detection works in the grid
---

<script>
	import { resolve } from '$app/paths';

	const placementPath = resolve('/examples/placement');
</script>

# Collision Behavior

The `collision` prop controls how the grid handles overlapping items when they are moved or resized.

With `push` and `compress`, this covers every way an item can end up on another one, not only dragging. An item moved through its `x`, `y`, `w` or `h` props moves the items it lands on. An item added on a cell that is already taken does not displace anything: with `push` it goes to the first free cell, and with `compress` it is compressed in below the items above it. With `none`, positions from props are applied as given, overlaps included.

## Collision Modes

### None (Default)

Setting `collision="none"` never moves an item the user is not dragging or resizing. This is the default behavior.

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';
</script>

<!-- ---cut--- -->
<Grid cols={10} rows={10} collision="none">
	<!-- Items can overlap each other -->
</Grid>
```

**Behavior:**

- A drag or resize never takes a cell another item covers: the outline stays at the last free cell
- An item the app adds or moves under the outline mid-drag stays where it was put, and the outline steps back to the last free cell it passed (the item's own place if there is none); the drop lands there. The same holds for a resize
- Positions and sizes set through props are applied as given, so the app can place items over each other

**Use cases:**

- When the app places items, overlaps included, and arranging one must never move the others
- For simpler use cases without dynamic rearrangement
- When you want full control over item positioning

### Push

Setting `collision="push"` causes items to move to the first available space when they would overlap.

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';
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

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';
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

### Shift

Setting `collision="shift"` makes items step aside for a drag, the way icons do on a phone home screen.

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';
	const itemSize = { height: 40 };
</script>

<Grid {itemSize} cols={10} collision="shift">
	<!-- Items make way in the direction the drag comes from -->
</Grid>
```

**Behavior:**

- The dragged item can hover over others; an item moves once the dragged item covers half of it (measured against the smaller of the two), and moves back when that drops below 30%
- An item moves away from the side the drag approached from: approached from the left it moves right, from above it moves down; items it lands on move on in the same direction
- An item pushed past the right edge wraps to the start of the next row; one with nowhere to go takes the nearest free cell
- While dragging, the layout is recomputed from where the items were when the drag started, so items that made way return when the drag moves on; only the drop keeps the result
- The cell the drag is heading for counts as taken: an item added or moved there mid-drag goes to the nearest free cell
- A new item declared on an occupied cell, or one without a position, takes the nearest free cell
- Resizing pushes items as `push` does

> **Note:** As with `push`, `rows` is ignored and the grid grows downwards, so `itemSize.height` must be provided.

The <a href={placementPath}>placement scenarios</a> show each of these rules, and how every mode handles the same case.

## Comparison

| Mode       | Overlap    | Auto-arrange | Best for                         |
| ---------- | ---------- | ------------ | -------------------------------- |
| `none`     | From props | No           | Simple layouts, manual control   |
| `push`     | No         | Pushes down  | Dashboard widgets, kanban boards |
| `compress` | No         | Fills gaps   | Compact layouts, masonry-style   |
| `shift`    | No         | Makes way    | Home-screen style rearranging    |

## Example: Push Collision

```svelte twoslash
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

```svelte twoslash
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: '0', x: 0, y: 0, w: 2, h: 5 },
		{ id: '1', x: 2, y: 2, w: 2, h: 2 },
		{ id: '2', x: 2, y: 0, w: 1, h: 2 }
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

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';
</script>

<!-- ---cut--- -->
<!-- Auto compress enabled (default) -->
<Grid collision="compress" autoCompress={true}>
	<!-- Items auto-compress after state changes -->
</Grid>

<!-- Auto compress disabled -->
<Grid collision="compress" autoCompress={false}>
	<!-- Manual compress via controller.compress() -->
</Grid>
```
