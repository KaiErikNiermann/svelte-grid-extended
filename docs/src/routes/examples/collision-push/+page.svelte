<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';

	let items = $state([
		{ id: '0', x: 0, y: 0, w: 2, h: 3 },
		{ id: '1', x: 2, y: 0, w: 2, h: 2 },
		{ id: '2', x: 4, y: 0, w: 2, h: 4 },
		{ id: '3', x: 2, y: 2, w: 2, h: 2 },
		{ id: '4', x: 6, y: 0, w: 2, h: 2 }
	]);

	const itemSize = { height: 40 };

	const exampleCode = String.raw`<script lang="ts">
  import Grid, { GridItem } from '@appulsauce/svelte-grid';

  const itemSize = { height: 40 };
<\/script>

<Grid {itemSize} cols={10} collision="push">
  {#each items as item (item.id)}
    <GridItem
      bind:x={item.x}
      bind:y={item.y}
      bind:w={item.w}
      bind:h={item.h}
    >
      ...
    </GridItem>
  {/each}
</Grid>`;
</script>

<svelte:head>
	<title>Collision Push Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Collision: Push</h1>
	<p>
		With <code>collision="push"</code>, items push others out of the way when moved. The grid grows
		vertically to accommodate displaced items.
	</p>
</div>

<div class="border border-border rounded-lg p-4 bg-muted/30">
	<Grid {itemSize} cols={10} collision="push">
		{#each items as item (item.id)}
			<GridItem
				id={item.id}
				bind:x={item.x}
				bind:y={item.y}
				bind:w={item.w}
				bind:h={item.h}
				class="grid-demo-item bg-primary/20 border border-primary/40 rounded"
			>
				{#snippet children()}{item.id}{/snippet}
			</GridItem>
		{/each}
	</Grid>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
	<blockquote>
		<strong>Note:</strong> When using <code>collision="push"</code>, <code>rows</code> is
		automatically set to <code>0</code> (infinite), so <code>itemSize.height</code> must be provided.
	</blockquote>
</div>
<CodeBlock class="mt-3" lang="svelte" code={exampleCode} />
