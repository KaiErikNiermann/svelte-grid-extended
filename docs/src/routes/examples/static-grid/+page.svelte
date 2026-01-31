<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';

	const itemSize = { width: 80, height: 40 };

	const exampleCode = String.raw`<script lang="ts">
  import Grid, { GridItem } from '@appulsauce/svelte-grid';

  const itemSize = { width: 80, height: 40 };
<\/script>

<Grid {itemSize} cols={10} rows={10}>
  <GridItem x={1} y={0}>
    {#snippet children()}Hey{/snippet}
  </GridItem>
  <GridItem x={3} y={3} w={4}>
    {#snippet children()}Hoy{/snippet}
  </GridItem>
</Grid>`;
</script>

<svelte:head>
	<title>Static Grid Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Static Grid</h1>
	<p>
		When <code>itemSize</code> is provided, the grid uses fixed pixel dimensions instead of adapting to
		the container. Each cell here is 80×40 pixels.
	</p>
</div>

<div class="border border-border rounded-lg p-4 bg-muted/30 overflow-auto">
	<Grid {itemSize} cols={10} rows={10}>
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
<CodeBlock class="mt-3" lang="svelte" code={exampleCode} />
