<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';

	const itemSize = { width: 80, height: 40 };
</script>

<svelte:head>
	<title>Without Bounds Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Without Bounds</h1>
	<p>When <code>cols</code> or <code>rows</code> is set to <code>0</code>, the grid grows infinitely in that dimension. The container expands to fit all items.</p>
</div>

<div class="border border-border rounded-lg p-4 bg-muted/30 overflow-auto">
	<Grid {itemSize} cols={0} rows={0}>
		<GridItem x={1} y={0} class="grid-demo-item bg-primary/20 border border-primary/40 rounded">
			{#snippet children()}Hey{/snippet}
		</GridItem>
		<GridItem x={3} y={3} w={4} class="grid-demo-item bg-primary/20 border border-primary/40 rounded">
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

  const itemSize = { width: 80, height: 40 };
</script>

<!-- cols={0} and rows={0} means infinite in both directions -->
<Grid {itemSize} cols={0} rows={0}>
  <GridItem x={1} y={0}>
    {#snippet children()}Hey{/snippet}
  </GridItem>
  <GridItem x={3} y={3} w={4}>
    {#snippet children()}Hoy{/snippet}
  </GridItem>
</Grid>`}
/>
