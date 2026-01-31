---
title: Styling
description: How to style grid components
---

# Styling

The Grid and GridItem components can be styled using CSS classes, inline styles, or CSS-in-JS frameworks like Tailwind CSS.

## Style Props

### Grid Container

```svelte
<Grid
	class="my-grid-container"
	style="border: 1px solid #ccc;"
	cols={10}
>
	<!-- items -->
</Grid>
```

### GridItem

| Prop | Purpose |
|------|---------|
| `class` | Main item container |
| `activeClass` | Applied during drag/resize |
| `previewClass` | The placeholder showing where item will drop |
| `resizerClass` | The resize handle element |
| `style` | Inline styles |

```svelte
<GridItem
	x={0}
	y={0}
	class="bg-white rounded-lg shadow"
	activeClass="opacity-50 scale-105"
	previewClass="bg-blue-100 border-2 border-blue-500 border-dashed rounded-lg"
	resizerClass="bg-blue-500"
>
	{#snippet children()}
		<div class="p-4">Content</div>
	{/snippet}
</GridItem>
```

## Component Structure

Understanding the DOM structure helps with styling:

```svelte
<!-- Grid Container -->
<div class="{gridClass}" style="{gridStyle}">

	<!-- GridItem -->
	<div class="{itemClass}" class:activeClass={isActive}>
		<!-- Your content via children snippet -->
		{@render children?.()}

		<!-- Resize handle (when resizable) -->
		<div class="{resizerClass}" />
	</div>

	<!-- Preview placeholder (during interaction) -->
	{#if isActive}
		<div class="{previewClass}" />
	{/if}

</div>
```

## Using Global Styles

Since the components use internal class bindings, you'll need `:global()` for custom styles:

```svelte
<Grid cols={10} rows={10}>
	<GridItem
		x={0}
		y={0}
		class="grid-item"
		activeClass="grid-item-active"
		previewClass="grid-item-preview"
	>
		{#snippet children()}
			<div class="content">Hello</div>
		{/snippet}
	</GridItem>
</Grid>

<style>
	:global(.grid-item) {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	:global(.grid-item:hover) {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	:global(.grid-item-active) {
		opacity: 0.7;
		transform: scale(1.02);
	}

	:global(.grid-item-preview) {
		background-color: rgba(59, 130, 246, 0.2);
		border: 2px dashed rgb(59, 130, 246);
		border-radius: 8px;
	}
</style>
```

## Using Tailwind CSS

Tailwind classes work directly on the props:

```svelte
<GridItem
	x={0}
	y={0}
	class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
	activeClass="opacity-50 ring-2 ring-blue-500"
	previewClass="bg-blue-100/50 border-2 border-dashed border-blue-400 rounded-lg"
	resizerClass="bg-blue-500 hover:bg-blue-600"
>
	{#snippet children()}
		<div class="p-4 h-full">
			<h3 class="font-semibold">Widget Title</h3>
			<p class="text-gray-600 text-sm">Content here</p>
		</div>
	{/snippet}
</GridItem>
```

## Transitions

Add smooth transitions to grid items:

```css
:global(.grid-item) {
	transition:
		transform 0.3s ease,
		width 0.3s ease,
		height 0.3s ease;
}
```

## Custom Resize Handle

Style the default resize handle or create a custom one:

```svelte
<GridItem x={0} y={0} resizerClass="custom-resizer">
	{#snippet children()}
		<div>Content</div>
	{/snippet}
</GridItem>

<style>
	:global(.custom-resizer) {
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, transparent 50%, #3b82f6 50%);
		cursor: se-resize;
	}
</style>
```

Or use a custom snippet:

```svelte
<GridItem x={0} y={0}>
	{#snippet resizeHandle(resizeStart)}
		<button
			class="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 rounded-full text-white text-xs"
			onpointerdown={resizeStart}
		>
			↘
		</button>
	{/snippet}

	{#snippet children()}
		<div>Content</div>
	{/snippet}
</GridItem>
```

## Example: Dashboard Cards

```svelte
<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';

	const items = [
		{ id: '1', x: 0, y: 0, w: 4, h: 3, title: 'Revenue', color: 'emerald' },
		{ id: '2', x: 4, y: 0, w: 4, h: 3, title: 'Users', color: 'blue' },
		{ id: '3', x: 0, y: 3, w: 8, h: 4, title: 'Chart', color: 'purple' },
	];

	const itemSize = { height: 50 };
</script>

<Grid {itemSize} cols={8} gap={16} collision="push">
	{#each items as item (item.id)}
		<GridItem
			x={item.x}
			y={item.y}
			w={item.w}
			h={item.h}
			class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
			activeClass="shadow-lg ring-2 ring-{item.color}-500"
			previewClass="bg-{item.color}-100 dark:bg-{item.color}-900/20 border-2 border-dashed border-{item.color}-500 rounded-xl"
		>
			{#snippet children()}
				<div class="p-4 h-full">
					<h3 class="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
				</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>
```
