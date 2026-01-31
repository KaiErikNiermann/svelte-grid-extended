---
title: Customization
description: Custom handles and advanced customization
---

# Customization

The Grid components provide several ways to customize behavior and appearance.

## Custom Move Handle

By default, the entire item is draggable. Use the `moveHandle` snippet to restrict dragging to a specific element:

```svelte
<GridItem x={0} y={0}>
	{#snippet moveHandle({ moveStart })}
		<div
			class="drag-handle cursor-move bg-gray-200 p-2"
			onpointerdown={moveStart}
		>
			⠿ Drag here
		</div>
	{/snippet}

	{#snippet children()}
		<div class="p-4">
			This content is not draggable directly.
			Use the handle above.
		</div>
	{/snippet}
</GridItem>
```

## Custom Resize Handle

Replace the default resize handle with your own:

```svelte
<GridItem x={0} y={0}>
	{#snippet resizeHandle({ resizeStart })}
		<button
			class="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-tl-lg cursor-se-resize"
			onpointerdown={resizeStart}
		>
			↘
		</button>
	{/snippet}

	{#snippet children()}
		<div class="p-4 pr-10 pb-10">Content</div>
	{/snippet}
</GridItem>
```

## Combined Custom Handles

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 4, h: 3 }
	]);

	const itemSize = { height: 50 };
</script>

<Grid {itemSize} cols={10} collision="push">
	{#each items as item (item.id)}
		<GridItem id={item.id} bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet moveHandle({ moveStart })}
				<div
					class="flex items-center gap-2 p-2 bg-gray-100 border-b cursor-move"
					onpointerdown={moveStart}
				>
					<span class="text-gray-400">⠿</span>
					<span class="font-medium">Widget Header</span>
				</div>
			{/snippet}

			{#snippet resizeHandle({ resizeStart })}
				<div
					class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize"
					onpointerdown={resizeStart}
				>
					<svg viewBox="0 0 24 24" class="w-full h-full text-gray-400">
						<path fill="currentColor" d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" />
					</svg>
				</div>
			{/snippet}

			{#snippet children()}
				<div class="p-4">
					<p class="text-gray-600">Widget content goes here</p>
				</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

## Disabling Interactions

### Read-only Grid

Disable all interactions on the entire grid:

```svelte
<Grid cols={10} rows={10} readOnly>
	<GridItem x={0} y={0}>
		{#snippet children()}
			<div>Can't move or resize</div>
		{/snippet}
	</GridItem>
</Grid>
```

### Per-item Control

Disable move and/or resize on specific items:

```svelte
<Grid cols={10} rows={10}>
	<!-- Fixed position, can resize -->
	<GridItem x={0} y={0} movable={false}>
		{#snippet children()}
			<div>Fixed position</div>
		{/snippet}
	</GridItem>

	<!-- Can move, fixed size -->
	<GridItem x={2} y={0} resizable={false}>
		{#snippet children()}
			<div>Fixed size</div>
		{/snippet}
	</GridItem>

	<!-- Completely static -->
	<GridItem x={4} y={0} movable={false} resizable={false}>
		{#snippet children()}
			<div>Static</div>
		{/snippet}
	</GridItem>
</Grid>
```

## Size Constraints

Set minimum and maximum sizes for items:

```svelte
<GridItem
	x={0}
	y={0}
	w={3}
	h={2}
	min={{ w: 2, h: 1 }}
	max={{ w: 6, h: 4 }}
>
	{#snippet children()}
		<div>Constrained: 2-6 wide, 1-4 tall</div>
	{/snippet}
</GridItem>
```

## Custom Attributes

Pass additional attributes to items using the spread operator:

```svelte
<script lang="ts">
	const items = [
		{ id: '1', x: 0, y: 0, w: 2, h: 2, data: { title: 'Widget A', color: 'blue' } },
		{ id: '2', x: 2, y: 0, w: 2, h: 2, data: { title: 'Widget B', color: 'green' } },
	];
</script>

<Grid cols={10}>
	{#each items as item (item.id)}
		<GridItem x={item.x} y={item.y} w={item.w} h={item.h} data-color={item.data.color}>
			{#snippet children()}
				<div class="p-2">
					<h3>{item.data.title}</h3>
				</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```

## Pattern Matching with ts-pattern

Use ts-pattern for complex item rendering logic:

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { match } from 'ts-pattern';

	type WidgetType = 'chart' | 'table' | 'metric';

	const items: Array<{ id: string; x: number; y: number; w: number; h: number; type: WidgetType }> = [
		{ id: '1', x: 0, y: 0, w: 4, h: 3, type: 'chart' },
		{ id: '2', x: 4, y: 0, w: 4, h: 2, type: 'metric' },
		{ id: '3', x: 0, y: 3, w: 8, h: 3, type: 'table' },
	];

	function getWidgetClass(type: WidgetType): string {
		return match(type)
			.with('chart', () => 'bg-blue-50 border-blue-200')
			.with('table', () => 'bg-green-50 border-green-200')
			.with('metric', () => 'bg-purple-50 border-purple-200')
			.exhaustive();
	}
</script>

<Grid cols={8}>
	{#each items as item (item.id)}
		<GridItem x={item.x} y={item.y} w={item.w} h={item.h} class={`border ${getWidgetClass(item.type)}`}>
			{#snippet children()}
				{#if item.type === 'chart'}
					<div>Chart Widget</div>
				{:else if item.type === 'table'}
					<div>Table Widget</div>
				{:else}
					<div>Metric Widget</div>
				{/if}
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```
