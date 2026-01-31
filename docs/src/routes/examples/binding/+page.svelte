<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';

	const initialItems = [
		{ x: 0, y: 0, w: 2, h: 2, label: 'A' },
		{ x: 2, y: 0, w: 3, h: 2, label: 'B' },
		{ x: 0, y: 2, w: 2, h: 3, label: 'C' }
	];

	let items = $state(initialItems.map((item) => ({ ...item })));
	const itemsBackup = initialItems.map((item) => ({ ...item }));

	function resetGrid() {
		items = itemsBackup.map((item) => ({ ...item }));
	}

	const itemSize = { height: 50 };
</script>

<svelte:head>
	<title>Two Way Binding Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Two Way Binding</h1>
	<p>
		Use <code>bind:</code> on item props to keep your state in sync with the grid. Move or resize items
		to see the values update.
	</p>
</div>

<div class="flex gap-4 mb-4">
	<button
		onclick={resetGrid}
		class="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
	>
		Reset Grid
	</button>
</div>

<div class="grid gap-6 lg:grid-cols-2">
	<div class="border border-border rounded-lg p-4 bg-muted/30">
		<Grid {itemSize} cols={8} collision="push">
			{#each items as item (item.label)}
				<GridItem
					bind:x={item.x}
					bind:y={item.y}
					bind:w={item.w}
					bind:h={item.h}
					class="grid-demo-item bg-primary/20 border border-primary/40 rounded"
				>
					{#snippet children()}{item.label}{/snippet}
				</GridItem>
			{/each}
		</Grid>
	</div>

	<div class="space-y-3">
		<h3 class="font-semibold text-sm">Current State</h3>
		{#each items as item}
			<div class="p-3 rounded-lg bg-muted text-sm font-mono">
				<span class="text-primary font-semibold">{item.label}:</span>
				x={item.x}, y={item.y}, w={item.w}, h={item.h}
			</div>
		{/each}
	</div>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
</div>
<CodeBlock
	class="mt-3"
	lang="svelte"
	code={`<script lang="ts">
  import Grid, { GridItem } from '@appulsauce/svelte-grid';

  let items = $state([
    { x: 0, y: 0, w: 2, h: 2, label: 'A' },
    { x: 2, y: 0, w: 3, h: 2, label: 'B' }
  ]);
</script>

<Grid cols={8}>
  {#each items as item (item.label)}
    <GridItem
      bind:x={item.x}
      bind:y={item.y}
      bind:w={item.w}
      bind:h={item.h}
    >
      {#snippet children()}{item.label}{/snippet}
    </GridItem>
  {/each}
</Grid>`}
/>
