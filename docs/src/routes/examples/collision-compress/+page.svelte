<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';
	import { scriptClose } from '$lib/snippet-utils';

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
${scriptClose}

<Grid {itemSize} cols={10} collision="compress">
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
	<title>Collision Compress Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Collision: Compress</h1>
	<p>
		With <code>collision="compress"</code>, items always move to the highest available position.
		Gaps are automatically filled, creating a compact layout.
	</p>
</div>

<div class="demo-panel">
	<Grid {itemSize} cols={10} collision="compress">
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
		<strong>Tip:</strong> Use <code>autoCompress={'{'}false{'}'}</code> to disable automatic
		compression and call <code>controller.compress()</code> manually.
	</blockquote>
</div>
<CodeBlock class="mt-3" lang="svelte" code={exampleCode} />
