---
title: Styling
description: How to style grid components
---

<script>
	import { resolve } from '$app/paths';

	const textAlignmentPath = resolve('/examples/text-alignment');
</script>

# Styling

The Grid and GridItem components can be styled using CSS classes, inline styles, or CSS-in-JS frameworks like Tailwind CSS.

## Style Props

### Grid Container

```svelte
<Grid class="my-grid-container" style="border: 1px solid #ccc;" cols={10}>
	<!-- items -->
</Grid>
```

### GridItem

| Prop           | Purpose                                      |
| -------------- | -------------------------------------------- |
| `class`        | Main item container                          |
| `activeClass`  | Applied during drag/resize                   |
| `previewClass` | The placeholder showing where item will drop |
| `resizerClass` | The resize handle element                    |
| `style`        | Inline styles                                |

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
<div class={gridClass} style={gridStyle}>
	<!-- GridItem -->
	<div class={itemClass} class:activeClass={isActive}>
		<!-- Your content via children snippet -->
		{@render children?.()}

		<!-- Resize handle (when resizable) -->
		<div class={resizerClass} />
	</div>

	<!-- Preview placeholder (during interaction) -->
	{#if isActive}
		<div class={previewClass} />
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
		transition:
			transform 0.2s,
			box-shadow 0.2s;
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

## Aligning Text in Items

Centring a grid item's content, or padding it, does not centre or align the letters. A line of text is as tall as its line box, and the line box includes room above the capitals and below the baseline that the letters do not fill. That room differs from font to font, and browsers round it to whole pixels in their own way, so labels in items of the same height sit at slightly different heights, and the first lines of top-aligned labels do not line up across items. This is not specific to the grid: it applies to any text in any box.

Measured on the <a href={textAlignmentPath}>text alignment example</a> without the trim, as the offset of the letters from where they should sit, in device pixels (Chromium 151, Firefox 153):

| Font, 14px             | Chromium, 1x | Chromium, 1.5x | Firefox, 1x | Firefox, 1.5x |
| ---------------------- | ------------ | -------------- | ----------- | ------------- |
| Inter, centred         | +0.12        | +0.18          | +0.41       | +0.61         |
| Monospace, centred     | -1.41        | -3.61          | -1.11       | -1.66         |
| Inter, top-aligned     | +4.83        | +7.24          | +5.12       | +7.68         |
| Monospace, top-aligned | +3.78        | +4.17          | +4.08       | +6.13         |

The fix is `text-box: trim-both cap alphabetic`. It trims a block's first and last line box to the capital height and the alphabetic baseline, so centring or padding the box places the letters themselves. With it, Chromium puts every label in the example within 0.02 device pixels of its target, in every font, and the labels line up across items.

```svelte
<GridItem x={0} y={0} w={2} h={1} class="card">
	<span class="label">Revenue</span>
</GridItem>

<style>
	/* text-box applies to block containers; a flex item is one already. */
	.label {
		display: block;
	}

	@supports (text-box: trim-both cap alphabetic) {
		.label {
			text-box: trim-both cap alphabetic;
		}
	}
</style>
```

- Put the trim on an element around the text, not on the item itself: the item's box would lose its own padding to the trim.
- Padding then measures from the letters, so a top padding of `0.75rem` puts the top of the capitals `0.75rem` below the item's edge, whatever the font.
- `text-box` is supported in Chrome and Edge 133+, Safari 18.2+ and Firefox 154+ (August 2026). Keep it inside `@supports`: an older browser then shows the untrimmed layout above, which is how the text looked before.

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
		{ id: '3', x: 0, y: 3, w: 8, h: 4, title: 'Chart', color: 'purple' }
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
