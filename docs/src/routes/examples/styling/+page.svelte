<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';

	const items = [
		{ id: '0', x: 0, y: 0, w: 2, h: 3 },
		{ id: '1', x: 2, y: 0, w: 2, h: 2 },
		{ id: '2', x: 4, y: 0, w: 3, h: 4 },
		{ id: '3', x: 2, y: 2, w: 2, h: 2 }
	];
</script>

<svelte:head>
	<title>Styling Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Styling</h1>
	<p>
		Grid items can be styled using <code>class</code>, <code>activeClass</code>, and
		<code>previewClass</code> props. The active class applies during drag/resize, and the preview class
		styles the drop target indicator.
	</p>
</div>

<div class="demo-panel">
	<Grid class="opacity-90" cols={10} rows={10}>
		{#each items as item}
			<GridItem
				x={item.x}
				y={item.y}
				w={item.w}
				h={item.h}
				class="bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 rounded-lg shadow-sm transition-[box-shadow,transform] duration-200"
				activeClass="opacity-50 scale-[1.02] shadow-lg"
				previewClass="bg-primary/20 border-2 border-dashed border-primary rounded-lg"
			>
				{#snippet children()}
					<div class="grid-demo-item">{item.id}</div>
				{/snippet}
			</GridItem>
		{/each}
	</Grid>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
</div>
<CodeBlock
	class="mt-3"
	lang="svelte"
	code={`<GridItem
  x={0}
  y={0}
  class="bg-gradient-to-br from-primary/30 to-primary/10 border rounded-lg"
  activeClass="opacity-50 scale-[1.02] shadow-lg"
  previewClass="bg-primary/20 border-2 border-dashed border-primary rounded-lg"
>
  {#snippet children()}
    <div>Content</div>
  {/snippet}
</GridItem>`}
/>
