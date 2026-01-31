---
title: Grid Component
description: API reference for the Grid component
---

# Grid Component

The `Grid` component is the main container for your grid layout. It manages the grid dimensions, item positioning, and collision behavior.

## Import

```typescript
import Grid from '@appulsauce/svelte-grid';
```

## Props

| Prop           | Type                                   | Default     | Description                                                                                    |
| -------------- | -------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `cols`         | `number`                               | `0`         | Grid columns count. If set to 0, grid will grow infinitely. Must be >= 0.                      |
| `rows`         | `number`                               | `0`         | Grid rows count. If set to 0, grid will grow infinitely. Must be >= 0.                         |
| `itemSize`     | `{ width?: number, height?: number }`  | `{}`        | Size of each grid cell in pixels. If not set, calculated from container size.                  |
| `gap`          | `number`                               | `10`        | Gap between grid items in pixels.                                                              |
| `bounds`       | `boolean`                              | `false`     | Whether grid items should be bounded by the container.                                         |
| `readOnly`     | `boolean`                              | `false`     | If true, disables all interactions with grid items.                                            |
| `collision`    | `'none' \| 'push' \| 'compress'`       | `'none'`    | Collision behavior when items overlap.                                                         |
| `autoCompress` | `boolean`                              | `true`      | Auto compress items when programmatically changing them. Only works with 'compress' collision. |
| `onchange`     | `(detail: LayoutChangeDetail) => void` | `undefined` | Callback when any item changes position or size.                                               |
| `class`        | `string`                               | `undefined` | CSS class for the grid container.                                                              |
| `style`        | `string`                               | `undefined` | Inline styles for the grid container.                                                          |

## Bindable Props

| Prop         | Type             | Description                                                             |
| ------------ | ---------------- | ----------------------------------------------------------------------- |
| `controller` | `GridController` | Access to grid methods like `getFirstAvailablePosition` and `compress`. |

## Grid Sizing Behavior

### Fixed Grid

When both `cols` and `rows` are set to positive numbers, the grid has a fixed size:

```svelte
<Grid cols={10} rows={10}>
	<!-- Grid has exactly 10x10 cells -->
</Grid>
```

### Static Grid (Fixed Pixel Dimensions)

When `itemSize` is provided along with `cols`/`rows`, the grid uses fixed pixel dimensions:

```svelte
<script>
	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={10} rows={10}>
	<!-- Each cell is 100x40 pixels -->
</Grid>
```

### Infinite Grid

When `cols` or `rows` is set to 0, the grid grows infinitely in that dimension:

```svelte
<script>
	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={0} rows={0}>
	<!-- Grid grows in both directions to fit content -->
</Grid>
```

> **Note:** When `cols` or `rows` is 0, the corresponding `itemSize.width` or `itemSize.height` must be set.

## Example

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@appulsauce/svelte-grid';

	let controller: GridController;

	const itemSize = { height: 50 };
</script>

<Grid cols={12} {itemSize} gap={8} collision="push" bind:controller class="my-grid">
	<GridItem x={0} y={0} w={4} h={2}>
		{#snippet children()}
			<div>Content</div>
		{/snippet}
	</GridItem>
</Grid>

<style>
	:global(.my-grid) {
		border: 1px solid #ccc;
		border-radius: 8px;
	}
</style>
```
