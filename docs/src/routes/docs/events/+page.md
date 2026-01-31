---
title: Events
description: Handling layout change events
---

# Events

The Grid and GridItem components emit events when items change position or size.

## Grid onchange

The Grid's `onchange` callback fires whenever any item in the grid changes:

```svelte
<script lang="ts">
	import Grid, { GridItem, type LayoutChangeDetail } from '@appulsauce/svelte-grid';

	function handleChange(detail: LayoutChangeDetail) {
		console.log('Layout changed:', detail);
	}
</script>

<Grid cols={10} onchange={handleChange}>
	<!-- items -->
</Grid>
```

## GridItem onchange

Each GridItem can have its own `onchange` callback:

```svelte
<script lang="ts">
	import Grid, { GridItem, type LayoutChangeDetail } from '@appulsauce/svelte-grid';

	function handleItemChange(detail: LayoutChangeDetail) {
		console.log('Item changed:', detail);
	}
</script>

<Grid cols={10}>
	<GridItem x={0} y={0} onchange={handleItemChange}>
		{#snippet children()}
			<div>Tracked Item</div>
		{/snippet}
	</GridItem>
</Grid>
```

## GridItem onpreviewchange

The `onpreviewchange` callback fires during drag/resize, before the final position is committed:

```svelte
<script lang="ts">
	import Grid, { GridItem, type LayoutChangeDetail } from '@appulsauce/svelte-grid';

	function handlePreviewChange(detail: LayoutChangeDetail) {
		// Called while dragging, shows where item will land
		console.log('Preview position:', detail);
	}
</script>

<Grid cols={10}>
	<GridItem x={0} y={0} onpreviewchange={handlePreviewChange}>
		{#snippet children()}
			<div>Drag me</div>
		{/snippet}
	</GridItem>
</Grid>
```

## LayoutChangeDetail Type

```typescript
interface LayoutChangeDetail {
	item: LayoutItem;        // The item that changed
	items: LayoutItem[];     // All items in the grid
}

interface LayoutItem {
	id: string;
	x: number;
	y: number;
	w: number;
	h: number;
}
```

## Example: Persisting Layout

```svelte
<script lang="ts">
	import Grid, { GridItem, type LayoutChangeDetail } from '@appulsauce/svelte-grid';
	import { onMount } from 'svelte';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 2, h: 2 },
		{ id: '2', x: 2, y: 0, w: 3, h: 1 },
	]);

	onMount(() => {
		const saved = localStorage.getItem('grid-layout');
		if (saved) {
			items = JSON.parse(saved);
		}
	});

	function handleChange(detail: LayoutChangeDetail) {
		// Save layout to localStorage
		localStorage.setItem('grid-layout', JSON.stringify(detail.items));
	}

	const itemSize = { height: 50 };
</script>

<Grid {itemSize} cols={10} collision="push" onchange={handleChange}>
	{#each items as item (item.id)}
		<GridItem id={item.id} bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

## Example: Real-time Preview

```svelte
<script lang="ts">
	import Grid, { GridItem, type LayoutChangeDetail } from '@appulsauce/svelte-grid';

	let previewInfo = $state<{ x: number; y: number; w: number; h: number } | null>(null);

	function handlePreview(detail: LayoutChangeDetail) {
		previewInfo = detail.item;
	}

	function handleChange() {
		previewInfo = null;
	}

	const itemSize = { height: 50 };
</script>

{#if previewInfo}
	<div class="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-sm">
		Position: ({previewInfo.x}, {previewInfo.y})
		Size: {previewInfo.w}x{previewInfo.h}
	</div>
{/if}

<Grid {itemSize} cols={10}>
	<GridItem
		x={0}
		y={0}
		onpreviewchange={handlePreview}
		onchange={handleChange}
	>
		{#snippet children()}
			<div class="item">Drag to see position</div>
		{/snippet}
	</GridItem>
</Grid>
```

## Two-way Binding vs Events

You can use either two-way binding or events to track changes:

**Two-way Binding** (recommended for reactive state):
```svelte
<GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
```

**Events** (useful for side effects):
```svelte
<GridItem x={item.x} y={item.y} onchange={saveToDatabase}>
```

You can also use both together:
```svelte
<GridItem
	bind:x={item.x}
	bind:y={item.y}
	bind:w={item.w}
	bind:h={item.h}
	onchange={persistLayout}
>
```
