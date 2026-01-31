# @appulsauce/svelte-grid

A draggable and resizable grid layout component for Svelte 5.

[![npm version](https://img.shields.io/npm/v/@appulsauce/svelte-grid.svg)](https://www.npmjs.com/package/@appulsauce/svelte-grid)
[![license](https://img.shields.io/npm/l/@appulsauce/svelte-grid.svg)](https://github.com/KaiErikNiermann/svelte-grid-extended/blob/main/LICENSE)

## Installation

```bash
npm install @appulsauce/svelte-grid
```

## Quick Start

```svelte
<script lang="ts">
	import Grid, { GridItem, type GridController } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 2, h: 2 },
		{ id: '2', x: 2, y: 0, w: 3, h: 1 }
	]);

	let gridController: GridController;

	function addItem() {
		const position = gridController.getFirstAvailablePosition(2, 2);
		if (position) {
			items = [...items, { id: crypto.randomUUID(), ...position, w: 2, h: 2 }];
		}
	}

	const itemSize = { height: 50 };
</script>

<button onclick={addItem}>Add Item</button>

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

## Features

- **Draggable & Resizable** - Move and resize grid items with mouse or touch
- **Collision Detection** - Three modes: `none`, `push`, `compress`
- **Two-way Binding** - Bind item positions directly to your state
- **Custom Handles** - Use snippets for custom move/resize handles
- **Grid Controller** - Programmatic control with `getFirstAvailablePosition()` and `compress()`
- **TypeScript** - Full type support included

## Documentation

For full documentation and examples, visit the [docs site](https://github.com/KaiErikNiermann/svelte-grid-extended) or run the docs locally:

```bash
# Clone the repository
git clone https://github.com/KaiErikNiermann/svelte-grid-extended.git
cd svelte-grid-extended

# Install dependencies
pnpm install
pnpm docs:install

# Run docs site
pnpm docs:dev
```

## API Overview

### Grid Props

| Prop        | Type                             | Default  | Description                      |
| ----------- | -------------------------------- | -------- | -------------------------------- |
| `cols`      | `number`                         | `0`      | Number of columns (0 = infinite) |
| `rows`      | `number`                         | `0`      | Number of rows (0 = infinite)    |
| `itemSize`  | `{ width?, height? }`            | `{}`     | Fixed cell size in pixels        |
| `gap`       | `number`                         | `10`     | Gap between items                |
| `collision` | `'none' \| 'push' \| 'compress'` | `'none'` | Collision behavior               |
| `readOnly`  | `boolean`                        | `false`  | Disable all interactions         |

### GridItem Props

| Prop        | Type      | Default  | Description              |
| ----------- | --------- | -------- | ------------------------ |
| `x`         | `number`  | required | X position in grid units |
| `y`         | `number`  | required | Y position in grid units |
| `w`         | `number`  | `1`      | Width in grid units      |
| `h`         | `number`  | `1`      | Height in grid units     |
| `movable`   | `boolean` | `true`   | Can be dragged           |
| `resizable` | `boolean` | `true`   | Can be resized           |

## Requirements

- Svelte 5.0.0+

## License

MIT
