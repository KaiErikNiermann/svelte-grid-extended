<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';
</script>

<svelte:head>
	<title>Basic Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Basic Grid</h1>
	<p>
		The simplest grid setup with fixed columns and rows. Drag items to reposition them, or resize
		using the bottom-right handle.
	</p>
</div>

<div class="border border-border rounded-lg p-4 bg-muted/30">
	<Grid cols={10} rows={10}>
		<GridItem x={1} y={0} class="grid-demo-item bg-primary/20 border border-primary/40 rounded">
			{#snippet children()}Hey{/snippet}
		</GridItem>
		<GridItem
			x={3}
			y={3}
			w={4}
			class="grid-demo-item bg-primary/20 border border-primary/40 rounded"
		>
			{#snippet children()}Hoy{/snippet}
		</GridItem>
	</Grid>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
</div>
<CodeBlock
	class="mt-3"
	lang="svelte"
	code={`<script lang="ts">
  import Grid, { GridItem } from '@appulsauce/svelte-grid';
</script>

<Grid cols={10} rows={10}>
  <GridItem x={1} y={0}>
    {#snippet children()}Hey{/snippet}
  </GridItem>
  <GridItem x={3} y={3} w={4}>
    {#snippet children()}Hoy{/snippet}
  </GridItem>
</Grid>`}
/>
