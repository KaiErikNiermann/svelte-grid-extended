---
title: GridItem Component
description: API reference for the GridItem component
---

# GridItem Component

The `GridItem` component represents an individual item within the grid. Each item has a position and size in grid units.

## Import

```typescript twoslash
import { GridItem } from '@appulsauce/svelte-grid';
```

## Props

| Prop              | Type                                    | Default          | Description                                                                        |
| ----------------- | --------------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `id`              | `string`                                | `uuid.v4`        | Unique identifier for the item. Used for collision detection.                      |
| `x`               | `number`                                | `undefined`      | X position (column) in grid units. Without `x` and `y` the item takes a free cell. |
| `y`               | `number`                                | `undefined`      | Y position (row) in grid units.                                                    |
| `w`               | `number`                                | `1`              | Width in grid units.                                                               |
| `h`               | `number`                                | `1`              | Height in grid units.                                                              |
| `min`             | `{ w: number, h: number }`              | `{ w: 1, h: 1 }` | Minimum size constraints.                                                          |
| `max`             | `{ w: number, h: number } \| undefined` | `undefined`      | Maximum size constraints. If undefined, no max limit.                              |
| `movable`         | `boolean`                               | `true`           | Whether the item can be dragged.                                                   |
| `resizable`       | `boolean`                               | `true`           | Whether the item can be resized.                                                   |
| `onchange`        | `(detail: LayoutChangeDetail) => void`  | `undefined`      | Callback when this item changes.                                                   |
| `onpreviewchange` | `(detail: LayoutChangeDetail) => void`  | `undefined`      | Callback when the preview position changes during drag.                            |

Positions and sizes are whole grid cells. A fractional value is rounded, a size is at least 1, and a value that is not a finite number (`NaN`, `Infinity`) is ignored: before the item joins the grid it gets the first free cell (or a size of 1), and afterwards it keeps its current value. An item placed outside a grid with fixed `cols` or `rows` is moved inside it. When the grid changes a value this way, the bound prop is updated to match.

## Style Props

| Prop           | Type     | Description                                              |
| -------------- | -------- | -------------------------------------------------------- |
| `class`        | `string` | CSS class for the grid item container.                   |
| `activeClass`  | `string` | CSS class applied when item is being dragged or resized. |
| `previewClass` | `string` | CSS class for the preview placeholder.                   |
| `resizerClass` | `string` | CSS class for the resize handle.                         |
| `style`        | `string` | Inline styles for the grid item.                         |

## Bindable Props

All position and size props (`x`, `y`, `w`, `h`) support two-way binding:

```svelte twoslash
<script lang="ts">
	import { GridItem } from '@appulsauce/svelte-grid';
	let item = $state({ x: 0, y: 0, w: 2, h: 2 });
</script>

<GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
	{#snippet children()}
		<div>Position: {item.x}, {item.y}</div>
	{/snippet}
</GridItem>
```

## Snippets

### children

The main content of the grid item:

```svelte twoslash
<script lang="ts">
	import { GridItem } from '@appulsauce/svelte-grid';
</script>

<!-- ---cut--- -->
<GridItem x={0} y={0}>
	{#snippet children()}
		<div class="my-content">Hello World</div>
	{/snippet}
</GridItem>
```

### moveHandle

Custom drag handle. Receives a `moveStart` function to initiate dragging. With a handle, only the handle starts a drag, and the rest of the item scrolls the page under a finger. Give the handle `touch-action: none` so a finger drags it at once rather than after the grid's `touchDelay`:

```svelte twoslash
<script lang="ts">
	import { GridItem } from '@appulsauce/svelte-grid';
</script>

<!-- ---cut--- -->
<GridItem x={0} y={0}>
	{#snippet moveHandle({ moveStart })}
		<div class="drag-handle" onpointerdown={moveStart}>Drag me</div>
	{/snippet}

	{#snippet children()}
		<div>Content</div>
	{/snippet}
</GridItem>
```

### resizeHandle

Custom resize handle. Receives a `resizeStart` function to initiate resizing. Like a move handle, it resizes at the first touch when it has `touch-action: none`:

```svelte twoslash
<script lang="ts">
	import { GridItem } from '@appulsauce/svelte-grid';
</script>

<!-- ---cut--- -->
<GridItem x={0} y={0}>
	{#snippet resizeHandle({ resizeStart })}
		<div class="resize-handle" onpointerdown={resizeStart}>⤡</div>
	{/snippet}

	{#snippet children()}
		<div>Content</div>
	{/snippet}
</GridItem>
```

## Component Structure

Understanding the DOM structure helps with styling:

```svelte
<!-- GridItem wrapper -->
<div class="{class}" class:activeClass={active}>
	<!-- Your content -->
	{@render children?.()}

	<!-- Resize handle (when resizable) -->
	<div class="{resizerClass}" />
</div>

<!-- Preview (shown during drag/resize) -->
{#if active}
	<div class="{previewClass}" />
{/if}
```

## Example

```svelte twoslash
<script lang="ts">
	import { GridItem } from '@appulsauce/svelte-grid';
</script>

<!-- ---cut--- -->
<GridItem
	id="item-1"
	x={0}
	y={0}
	w={3}
	h={2}
	min={{ w: 2, h: 1 }}
	max={{ w: 6, h: 4 }}
	class="bg-blue-100"
	activeClass="opacity-50"
	previewClass="bg-blue-500/20 border-2 border-blue-500 border-dashed"
>
	{#snippet moveHandle({ moveStart })}
		<div class="cursor-move p-2 bg-blue-200" onpointerdown={moveStart}>⠿ Drag</div>
	{/snippet}

	{#snippet children()}
		<div class="p-4">Resizable content with custom drag handle</div>
	{/snippet}
</GridItem>
```
