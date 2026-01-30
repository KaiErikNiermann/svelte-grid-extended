# @kaierikniermann/svelte-grid

##### Example

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@kaierikniermann/svelte-grid';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 2, h: 5 },
		{ id: '2', x: 2, y: 2, w: 2, h: 2 }
	]);

	let gridController: GridController;

	function addNewItem() {
		const w = Math.floor(Math.random() * 2) + 1;
		const h = Math.floor(Math.random() * 5) + 1;
		const newPosition = gridController.getFirstAvailablePosition(w, h);
		items = newPosition
			? [...items, { id: crypto.randomUUID(), x: newPosition.x, y: newPosition.y, w, h }]
			: items;
	}

	const itemSize = { height: 40 };
</script>

<button onclick={addNewItem}>Add New Item</button>

<Grid {itemSize} cols={10} collision="push" bind:controller={gridController}>
	{#each items as { id, x, y, w, h } (id)}
		<GridItem {id} bind:x bind:y bind:w bind:h>
			{#snippet children()}
				<div>{id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```
- [GridItem props](#griditem-props)
- [Style related props:](#style-related-props)
- [Events](#events)
- [Grid Controller](#grid-controller)
- [Methods](#methods)
  - [getFirstAvailablePosition(w, h)](#getfirstavailablepositionw-h)
  - [Example](#example)
- [License](#-license)

## Usage

### Basic

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';
</script>

<Grid cols={10} rows={10}>
	<GridItem x={1} y={0} class="item">{#snippet children()}Hey{/snippet}</GridItem>
	<GridItem x={3} y={3} w={4} class="item">{#snippet children()}Hoy{/snippet}</GridItem>
</Grid>
```

### Static grid

When `cols` or `rows` and `itemsSize` are set, grid becomes static and ignores the size of the container.

It can be set to both dimensions or just one.

Both:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';

	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={10} rows={10}>
	<GridItem x={1} y={0} class="item">{#snippet children()}Hey{/snippet}</GridItem>
	<GridItem x={3} y={3} w={4} class="item">{#snippet children()}Hoy{/snippet}</GridItem>
</Grid>
```

Only rows:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';

	const itemSize = { height: 40 };
</script>

<Grid {itemSize} cols={10} rows={10}>
	<GridItem x={1} y={0} class="item">{#snippet children()}Hey{/snippet}</GridItem>
	<GridItem x={3} y={3} w={4} class="item">{#snippet children()}Hoy{/snippet}</GridItem>
</Grid>
```

### Grid without bounds

When `cols` or/and `rows` set to 0, grid grows infinitely. The grid container adapts its width and height to fit all elements.

It can be set to both dimensions or just one.

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';

	const itemSize = { width: 100, height: 40 };
</script>

<Grid {itemSize} cols={0} rows={0}>
	<GridItem x={1} y={0} class="item">{#snippet children()}Hey{/snippet}</GridItem>
	<GridItem x={3} y={3} w={4} class="item">{#snippet children()}Hoy{/snippet}</GridItem>
</Grid>
```

### Styling

Grid can be styled with classes passed to various props. Check [Style related props](#style-related-props) section for more info.

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';
</script>

<Grid class="grid-container" cols={10} rows={10}>
	<GridItem
		x={0}
		y={0}
		class="grid-item"
		activeClass="grid-item-active"
		previewClass="bg-green-500 rounded"
		resizerClass=""
	>
		{#snippet children()}
			<div class="item">Content</div>
		{/snippet}
	</GridItem>
</Grid>

<style>
	:global(.grid-container) {
		opacity: 0.7;
	}

	:global(.grid-item) {
		transition:
			width 4s,
			height 4s;
		transition:
			transform 4s,
			opacity 4s;
	}

	:global(.grid-item-active) {
		opacity: 0.1;
	}

	:global(.bg-green-500) {
		background-color: rgb(34, 197, 94);
	}

	:global(.rounded) {
		border-radius: 0.25rem;
	}
</style>
```

### Disable interactions

To disable interactions, set `readOnly` prop to `true`. Or set `movable` and/or `resizable` to `false` on specific item.

Read Only grid:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';
</script>

<Grid cols={10} rows={10} readOnly>
	<GridItem x={1} y={0} class="item">{#snippet children()}Hey{/snippet}</GridItem>
	<GridItem x={3} y={3} w={4} class="item">{#snippet children()}Hoy{/snippet}</GridItem>
</Grid>
```

Make item non-interactive:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';
</script>

<Grid cols={10} rows={10}>
	<GridItem x={1} y={0} class="item" movable={false}>{#snippet children()}Hey{/snippet}</GridItem>
	<GridItem x={3} y={3} w={4} class="item" resizable={false}>{#snippet children()}Hoy{/snippet}</GridItem>
</Grid>
```

### Collision Behavior

The `collision` prop controls how the grid handles collisions. There are three available options: `none`, `push`, and `compress`.

#### None

Setting `collision` prop to `none` will ignore any collisions. This is the default behavior.

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';

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

<Grid {itemSize} cols={10} collision="none">
	{#each items as item (item.id)}
		<GridItem x={item.x} y={item.y} w={item.w} h={item.h}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

#### Push

Setting `collision` prop to `push` will cause grid items to move to the first available space when colliding. The grid will grow vertically as needed to accommodate all items.

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';

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
		<GridItem x={item.x} y={item.y} w={item.w} h={item.h}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

#### Compress

Setting `collision` prop to `compress` will compress items vertically towards the top into any available space when colliding. The grid will grow vertically as needed to accommodate all items.

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';

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

<Grid {itemSize} cols={10} collision="compress">
	{#each items as item (item.id)}
		<GridItem x={item.x} y={item.y} w={item.w} h={item.h}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

> Setting `collision` to `push` or `compress` will set `rows` to `0` so `ItemSize.height` must be set.

### Custom move/resize handle

You can customize the move and resize handles using snippets:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';
</script>

<Grid cols={10} rows={10}>
	<GridItem x={0} y={0}>
		{#snippet moveHandle(moveStart)}
			<div onpointerdown={moveStart}>MOVE</div>
		{/snippet}

		{#snippet resizeHandle(resizeStart)}
			<div onpointerdown={resizeStart}>RESIZE</div>
		{/snippet}

		{#snippet children()}
			<!-- content -->
			<div>Content here</div>
		{/snippet}
	</GridItem>
</Grid>
```

### Two way binding

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@kaierikniermann/svelte-grid';

	let items = $state([
		{ x: 6, y: 0, w: 2, h: 2, data: { text: 'A' } },
		{ x: 6, y: 2, w: 2, h: 2, data: { text: 'B' } }
	]);

	const itemsBackup = structuredClone($state.snapshot(items));

	function resetGrid() {
		items = structuredClone(itemsBackup);
	}

	const itemSize = { height: 40 };
</script>

<button onclick={resetGrid}>RESET</button>

<Grid cols={10} {itemSize}>
	{#each items as item (item.data.text)}
		<GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				{item.data.text}
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

## API Documentation

### Grid props

| prop         | description                                                                                                            | type                                | default |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------- |
| cols         | Grid columns count. If set to 0, grid will grow infinitly. Must be >= 0.                                               | number                              | 0       |
| rows         | Grid rows count. If set to 0, grid will grow infinitly. Must be >= 0.                                                  | number                              | 0       |
| itemSize     | Size of the grid item. If not set, grid will calculate it based on container size.                                     | { width?: number, height?: number } | {}      |
| gap          | Gap between grid items.                                                                                                | number                              | 10      |
| bounds       | Should grid items be bounded by the grid container.                                                                    | boolean                             | false   |
| readonly     | If true disables interaction with grid items.                                                                          | boolean                             | false   |
| collision    | Collision behavior of grid items. [About](#collision-behavior)                                                         | none \| push \| compress            | none    |
| autoCompress | Auto compress the grid items when programmatically changing grid items. Only works with 'compress' collision strategy. | boolean                             | true    |
| onchange     | Callback when grid items are changed.                                                                                  | (detail: LayoutChangeDetail) => void | undefined |

> If `cols` or/and `rows` are set to 0, `itemSize.width` or/and `itemSize.height` must be set.

> Setting `collision` to `push` or `compress` will set `rows` to `0` so `ItemSize.height` must be set.

### GridItem props

| prop      | description                                                                                        | type                                  | default        |
| --------- | -------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------- |
| id        | Unique id of the item. Used to compare items during collision tests                                | string                                | uuid.v4        |
| x         | X position of the item in grid units.                                                              | number                                | required       |
| y         | Y position of the item in grid units.                                                              | number                                | required       |
| w         | Width of the item in grid units.                                                                   | number                                | 1              |
| h         | Height of the item in grid units.                                                                  | number                                | 1              |
| min       | Minimum size of the item in Grid Units.                                                            | { w: number, h: number }              | { w: 1, h: 1 } |
| max       | Maximum size of the item in Grid Units. If not provided, the item will be able to grow infinitely. | { w: number, h: number } \| undefined | undefined      |
| movable   | If true, item can be moved by user.                                                                | boolean                               | true           |
| resizable | If true, item can be resized by user.                                                              | boolean                               | true           |
| onchange  | Callback when item position/size changes.                                                          | (detail: LayoutChangeDetail) => void  | undefined      |
| onpreviewchange | Callback when preview position/size changes during drag.                                     | (detail: LayoutChangeDetail) => void  | undefined      |

### Style related props:

Component can be styled with css framework of your choice, global classes or `style` prop. To do so, you can use the following props:

- `<Grid class="..." />` - class name for grid container.
- `<Grid style="..." />` - inline style for grid container.
- `<GridItem class="..." />` - class name for grid item.
- `<GridItem activeClass="..." />` - class name that applies when item is currently being dragged or resized. By default, it is used to make active grid item transparent.
- `<GridItem previewClass="..." />` - class name for preview where item will be placed after interaction.
- `<GridItem resizerClass="..." />` - class name for item's resize handle.
- `<GridItem style="..." />` - inline style for grid item.

To understand how to use these props, look at `<Grid />` component simplified structure.

> `active` is a variable that indicates if grid item is currently being dragged or resized:

```svelte
<!-- Grid -->
<div class={class}>
	<!-- GridItem -->
	<div class={itemClass} class:activeClass={active}>
		{@render children?.()}
		<!-- Resizer -->
		<div class={resizerClass} />
		<!-- Resizer -->
	</div>

	{#if active}
		<!-- GridItemGhost (preview) -->
		<div class={previewClass} />
	{/if}

	<!-- /GridItem -->
</div>
<!-- /Grid -->
```


##### Example

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@kaierikniermann/svelte-grid';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 2, h: 5 },
		{ id: '2', x: 2, y: 2, w: 2, h: 2 }
	]);

	let gridController: GridController;

	function compressItems() {
		gridController.compress();
	}

	const itemSize = { height: 40 };
</script>

<button class="btn" onclick={compressItems}>Compress Items</button>

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
### Methods

#### getFirstAvailablePosition(w, h)

Finds the first available position within the grid that can accommodate an item of the specified width (w) and height (h). This method is useful when dynamically adding new items to the grid, ensuring that they fit into the first available space that can hold them.

**Parameters:**

- `w` (number): Width of the item.
- `h` (number): Height of the item.

**Returns:**

- An object containing the `x` and `y` coordinates of the first available position, or `null` if no position is available.

##### Example

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@kaierikniermann/svelte-grid';

	let items = [
		{ id: '1', x: 0, y: 0, w: 2, h: 5 },
		{ id: '2', x: 2, y: 2, w: 2, h: 2 }
	];

	let gridController: GridController;

	function addNewItem() {
		const w = Math.floor(Math.random() * 2) + 1;
		const h = Math.floor(Math.random() * 5) + 1;
		const newPosition = gridController.getFirstAvailablePosition(w, h);
		items = newPosition
			? [...items, { id: crypto.randomUUID(), x: newPosition.x, y: newPosition.y, w, h }]
			: items;
	}

	const itemSize = { height: 40 };
</script>

<button on:click={addNewItem}>Add New Item</button>

<Grid {itemSize} cols={10} collision="push" bind:controller={gridController}>
	{#each items as { id, x, y, w, h } (id)}
		<div transition:fade={{ duration: 300 }}>
			<GridItem {id} bind:x bind:y bind:w bind:h>
				<div>{id}</div>
			</GridItem>
		</div>
	{/each}
</Grid>
```

#### compress()

Compresses all items vertically towards the top into any available space.

##### Example

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@kaierikniermann/svelte-grid';

	let items = [
		{ id: '1', x: 0, y: 0, w: 2, h: 5 },
		{ id: '2', x: 2, y: 2, w: 2, h: 2 }
	];

	let gridController: GridController;

	function compressItems() {
		gridController.compress();
	}

	const itemSize = { height: 40 };
</script>

<button class="btn" on:click={compressItems}>Compress Items</button>

<Grid {itemSize} cols={10} collision="push" bind:controller={gridController}>
	{#each items as item (item.id)}
		<GridItem id={item.id} bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			<div class="item">{item.id.slice(0, 5)}</div>
		</GridItem>
	{/each}
</Grid>
```

## License

MIT
