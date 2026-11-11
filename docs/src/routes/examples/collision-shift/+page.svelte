<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '#lib/components/index.ts';
	import { scriptClose } from '#lib/snippet-utils.ts';

	let items = $state([
		{ id: '0', x: 0, y: 0, w: 2, h: 2 },
		{ id: '1', x: 2, y: 0, w: 1, h: 1 },
		{ id: '2', x: 3, y: 0, w: 1, h: 1 },
		{ id: '3', x: 4, y: 0, w: 2, h: 1 },
		{ id: '4', x: 2, y: 1, w: 2, h: 1 },
		{ id: '5', x: 0, y: 2, w: 4, h: 1 },
		{ id: '6', x: 4, y: 1, w: 1, h: 2 },
		{ id: '7', x: 5, y: 1, w: 1, h: 1 }
	]);

	const itemSize = { height: 50 };

	const exampleCode = String.raw`<script lang="ts">
  import Grid, { GridItem } from '@appulsauce/svelte-grid';

  const itemSize = { height: 50 };
${scriptClose}

<Grid {itemSize} cols={6} collision="shift">
  {#each items as item (item.id)}
    <GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
      ...
    </GridItem>
  {/each}
</Grid>`;
</script>

<svelte:head>
	<title>Collision Shift Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Collision: Shift</h1>
	<p>
		With <code>collision="shift"</code>, a dragged item can hover over the others. Once it covers
		half of an item, that item makes way in the direction the drag came from: approached from the
		left it moves right, from above it moves down, and an item pushed past the right edge wraps to
		the next row. Items that made way return when the drag moves on; only the drop keeps the new
		layout.
	</p>
	<p>
		The <a href="./placement">placement scenarios</a> walk through each rule one case at a time.
	</p>
</div>

<div class="demo-panel">
	<Grid {itemSize} cols={6} collision="shift">
		{#each items as item (item.id)}
			<GridItem
				id={item.id}
				bind:x={item.x}
				bind:y={item.y}
				bind:w={item.w}
				bind:h={item.h}
				class="grid-demo-item"
			>
				{#snippet children()}{item.id}{/snippet}
			</GridItem>
		{/each}
	</Grid>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
	<blockquote>
		<strong>Note:</strong> As with <code>push</code>, <code>rows</code> is ignored and the grid
		grows downwards, so <code>itemSize.height</code> must be provided.
	</blockquote>
</div>
<CodeBlock class="mt-3" lang="svelte" code={exampleCode} />
