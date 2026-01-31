<script lang="ts">
	import Grid, { GridItem, type GridController } from '@appulsauce/svelte-grid';
	import { Plus, RotateCcw, X } from 'lucide-svelte';
	import { CodeBlock } from '$lib/components';
	import { scriptClose } from '$lib/snippet-utils';

	const initialItems = [
		{ id: crypto.randomUUID(), x: 0, y: 0, w: 2, h: 2 },
		{ id: crypto.randomUUID(), x: 2, y: 0, w: 3, h: 2 },
		{ id: crypto.randomUUID(), x: 0, y: 2, w: 2, h: 3 }
	];

	let items = $state(initialItems.map((item) => ({ ...item })));
	const itemsBackup = initialItems.map((item) => ({ ...item }));

	let gridController: GridController | undefined = $state();

	function addItem() {
		const w = Math.floor(Math.random() * 2) + 1;
		const h = Math.floor(Math.random() * 3) + 1;
		const position = gridController?.getFirstAvailablePosition(w, h);
		if (position) {
			items = [...items, { id: crypto.randomUUID(), ...position, w, h }];
		}
	}

	function removeItem(id: string) {
		items = items.filter((item) => item.id !== id);
	}

	function resetGrid() {
		items = itemsBackup.map((item) => ({ ...item }));
	}

	const itemSize = { height: 50 };

	const exampleCode = String.raw`<script lang="ts">
  import Grid, { GridItem, type GridController } from '@appulsauce/svelte-grid';

  let items = $state([...]);
  let gridController: GridController | undefined = $state();

  function addItem() {
    const w = 2, h = 2;
    const position = gridController?.getFirstAvailablePosition(w, h);
    if (position) {
      items = [...items, { id: crypto.randomUUID(), ...position, w, h }];
    }
  }

  function removeItem(id: string) {
    items = items.filter(item => item.id !== id);
  }
${scriptClose}

<button onclick={addItem}>Add</button>

<Grid cols={8} collision="push" bind:controller={gridController}>
  {#each items as item (item.id)}
    <GridItem id={item.id} bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
      {#snippet children()}
        <button onclick={() => removeItem(item.id)}>X</button>
      {/snippet}
    </GridItem>
  {/each}
</Grid>`;
</script>

<svelte:head>
	<title>Add/Remove Items Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Add/Remove Items</h1>
	<p>
		Use the Grid Controller to find available positions when adding items. The <code
			>getFirstAvailablePosition(w, h)</code
		> method returns the first position that can fit an item of the given size.
	</p>
</div>

<div class="flex gap-2 mb-4">
	<button
		onclick={addItem}
		class="btn btn-sm btn-primary"
	>
		<Plus class="h-4 w-4" />
		Add Item
	</button>
	<button
		onclick={resetGrid}
		class="btn btn-sm btn-outline"
	>
		<RotateCcw class="h-4 w-4" />
		Reset
	</button>
</div>

<div class="demo-panel">
	<Grid {itemSize} cols={8} collision="push" bind:controller={gridController}>
		{#each items as item (item.id)}
			<GridItem
				id={item.id}
				bind:x={item.x}
				bind:y={item.y}
				bind:w={item.w}
				bind:h={item.h}
				class="relative bg-primary/20 border border-primary/40 rounded"
			>
				{#snippet children()}
					<button
						onclick={(e) => {
							e.stopPropagation();
							removeItem(item.id);
						}}
						onpointerdown={(e) => e.stopPropagation()}
						class="absolute top-1 right-1 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
						aria-label="Remove item"
					>
						<X class="h-3 w-3" />
					</button>
					<div class="grid-demo-item">{item.id.slice(0, 4)}</div>
				{/snippet}
			</GridItem>
		{/each}
	</Grid>
</div>

<div class="mt-4 text-sm text-muted-foreground">
	{items.length} items in grid
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
</div>
<CodeBlock class="mt-3" lang="svelte" code={exampleCode} />
