---
title: Grid Component
description: API reference for the Grid component
---

# Grid Component

The `Grid` component is the main container for your grid layout. It manages the grid dimensions, item positioning, and collision behavior.

## Import

```typescript twoslash
import Grid from '@appulsauce/svelte-grid';
```

## Props

| Prop            | Type                                        | Default     | Description                                                                                                                                              |
| --------------- | ------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cols`          | `number`                                    | `0`         | Grid columns count. If set to 0, grid will grow infinitely. Must be >= 0.                                                                                |
| `rows`          | `number`                                    | `0`         | Grid rows count. If set to 0, grid will grow infinitely. Must be >= 0.                                                                                   |
| `itemSize`      | `{ width?: number, height?: number }`       | `{}`        | Size of each grid cell in pixels. If not set, calculated from container size.                                                                            |
| `gap`           | `number`                                    | `10`        | Gap between grid items in pixels.                                                                                                                        |
| `bounds`        | `boolean`                                   | `false`     | Whether grid items should be bounded by the container.                                                                                                   |
| `readOnly`      | `boolean`                                   | `false`     | If true, disables all interactions with grid items.                                                                                                      |
| `collision`     | `'none' \| 'push' \| 'compress' \| 'shift'` | `'none'`    | Collision behavior when items overlap.                                                                                                                   |
| `autoCompress`  | `boolean`                                   | `true`      | Auto compress items when programmatically changing them. Only works with 'compress' collision.                                                           |
| `skipOffscreen` | `boolean`                                   | `true`      | Let the browser skip rendering the grid while it is away from the viewport. Turn it off for items that draw outside the grid; see Pages With Many Grids. |
| `touchDelay`    | `number`                                    | `300`       | How long, in milliseconds, a finger or pen is held on an item before its drag starts. `0` drags at once. See Touch Screens.                              |
| `dragThreshold` | `number`                                    | `4`         | How far, in pixels, a press has to move before its drag or resize starts; a shorter press is a click. `0` starts at the press. See Clicks And Drags.     |
| `onchange`      | `(detail: LayoutChangeDetail) => void`      | `undefined` | Callback when any item changes position or size.                                                                                                         |
| `class`         | `string`                                    | `undefined` | CSS class for the grid container.                                                                                                                        |
| `style`         | `string`                                    | `undefined` | Inline styles for the grid container.                                                                                                                    |

## Bindable Props

| Prop         | Type             | Description                                                             |
| ------------ | ---------------- | ----------------------------------------------------------------------- |
| `controller` | `GridController` | Access to grid methods like `getFirstAvailablePosition` and `compress`. |

## Grid Sizing Behavior

### Fixed Grid

When both `cols` and `rows` are set to positive numbers, the grid has a fixed size:

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';
</script>

<!-- ---cut--- -->
<Grid cols={10} rows={10}>
	<!-- Grid has exactly 10x10 cells -->
</Grid>
```

### Static Grid (Fixed Pixel Dimensions)

When `itemSize` is provided along with `cols`/`rows`, the grid uses fixed pixel dimensions:

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';

	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={10} rows={10}>
	<!-- Each cell is 100x40 pixels -->
</Grid>
```

### Infinite Grid

When `cols` or `rows` is set to 0, the grid grows infinitely in that dimension:

```svelte twoslash
<script lang="ts">
	import Grid from '@appulsauce/svelte-grid';

	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={0} rows={0}>
	<!-- Grid grows in both directions to fit content -->
</Grid>
```

> **Note:** When `cols` or `rows` is 0, the corresponding `itemSize.width` or `itemSize.height` must be set.

## Pages With Many Grids

Every grid is drawn with `content-visibility: auto`, so the browser skips laying out, painting and hit-testing a grid's items while it is away from the viewport and catches up as it scrolls near. On a page of many large grids this keeps scrolling smooth on slow machines. A skipped grid keeps its size, and its items stay available to screen readers and find-in-page.

The property also brings paint containment, which has two effects while it is on: anything an item draws outside the grid's box is clipped, and `position: fixed` content inside the grid is positioned relative to the grid instead of the viewport. Popovers and dialogs shown in the top layer (the `popover` attribute, `<dialog>` with `showModal()`) are not affected. The grid turns skipping off for the length of a drag or resize, so a dragged item is never clipped. For a grid whose items show menus or tooltips past its edges, turn it off with `skipOffscreen={false}`:

```svelte
<Grid cols={12} skipOffscreen={false}>
	<!-- Items with dropdowns that reach outside the grid -->
</Grid>
```

## Clicks And Drags

A press on an item starts its drag only once the pointer has moved more than `dragThreshold` pixels (4 by default) from where it went down. A press and release that moves less is an ordinary click, so a part of an item can be clicked and dragged by: a header that selects its card on click and moves it on drag, as in the Custom Handles example. A drag that did start ends without a click, so a click handler on the item does not also run after every drag. The same holds for resize handles.

`dragThreshold={0}` starts the drag at the press, as earlier versions always did, and then no press on an item counts as a click. A finger held for the `touchDelay` starts its drag at once, since the wait has already told it apart from a tap.

```svelte
<Grid cols={10} dragThreshold={8}>
	<!-- A press must move 8px before a drag starts -->
</Grid>
```

## Touch Screens

On a touch screen a grid can fill the whole screen, so a finger on an item must still be able to scroll the page. A finger or pen therefore has to be held still on an item for `touchDelay` milliseconds (300 by default) before its drag starts; the item is then shown as active and follows the finger. A finger that moves before then scrolls the page as usual, and a quick tap does nothing. A mouse never waits; it starts once it moves past the `dragThreshold` (see below). While the finger is held, before the drag starts, the item has a `data-holding` attribute, so a page can show that the press is being counted, as the Touch example does with a bar that fills over `touchDelay`.

Some parts of an item start at the first touch, because the browser could not scroll from them anyway: the default resize handle, and any handle of your own with `touch-action: none` (see Customization). While a drag runs, the page does not scroll or zoom under it, and a second finger neither moves the dragged item nor starts a drag on another item of the same grid.

For a grid that never needs to scroll the page, such as a full-screen board, `touchDelay={0}` drags at the first touch. The items then take every touch, so the page cannot be scrolled from them:

```svelte
<Grid cols={6} rows={4} touchDelay={0}>
	<!-- A board that fits the screen -->
</Grid>
```

## Example

```svelte twoslash
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
