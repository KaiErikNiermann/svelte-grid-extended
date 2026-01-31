<script lang="ts">
	import Grid, { GridItem, type LayoutChangeDetail } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';

	let items = $state([
		{ id: '1', x: 0, y: 0, w: 2, h: 2 },
		{ id: '2', x: 2, y: 0, w: 3, h: 2 }
	]);

	let lastEvent = $state<LayoutChangeDetail | null>(null);
	let eventLog = $state<string[]>([]);

	function handleChange(detail: LayoutChangeDetail) {
		lastEvent = detail;
		eventLog = [
			`Change: Item ${detail.item.id} → (${detail.item.x}, ${detail.item.y}) ${detail.item.w}×${detail.item.h}`,
			...eventLog.slice(0, 9)
		];
	}

	function handleItemChange(detail: LayoutChangeDetail) {
		eventLog = [`Item ${detail.item.id} changed`, ...eventLog.slice(0, 9)];
	}

	const itemSize = { height: 50 };

	const exampleCode = String.raw`<script lang="ts">
  import Grid, { GridItem, type LayoutChangeDetail } from '@appulsauce/svelte-grid';

  function handleChange(detail: LayoutChangeDetail) {
    console.log('Layout changed:', detail.item);
    // Persist to database, localStorage, etc.
  }
</script>

<Grid onchange={handleChange}>
  <GridItem x={0} y={0} onchange={handleChange}>
    ...
  </GridItem>
</Grid>`;
</script>

<svelte:head>
	<title>Events Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Events</h1>
	<p>
		Listen to layout changes using the <code>onchange</code> callback on Grid or individual GridItems.
		Useful for persisting layout or triggering side effects.
	</p>
</div>

<div class="grid gap-6 lg:grid-cols-2">
	<div class="border border-border rounded-lg p-4 bg-muted/30">
		<Grid {itemSize} cols={8} collision="push" onchange={handleChange}>
			{#each items as item (item.id)}
				<GridItem
					id={item.id}
					bind:x={item.x}
					bind:y={item.y}
					bind:w={item.w}
					bind:h={item.h}
					onchange={handleItemChange}
					class="grid-demo-item bg-primary/20 border border-primary/40 rounded"
				>
					{#snippet children()}{item.id}{/snippet}
				</GridItem>
			{/each}
		</Grid>
	</div>

	<div class="space-y-4">
		<div>
			<h3 class="font-semibold text-sm mb-2">Last Event</h3>
			<div class="p-3 rounded-lg bg-muted text-xs font-mono overflow-auto max-h-32">
				{#if lastEvent}
					<pre>{JSON.stringify(lastEvent, null, 2)}</pre>
				{:else}
					<span class="text-muted-foreground">Move or resize an item...</span>
				{/if}
			</div>
		</div>

		<div>
			<h3 class="font-semibold text-sm mb-2">Event Log</h3>
			<div class="p-3 rounded-lg bg-muted text-xs font-mono space-y-1 max-h-48 overflow-auto">
				{#each eventLog as log}
					<div class="text-muted-foreground">{log}</div>
				{:else}
					<span class="text-muted-foreground">No events yet...</span>
				{/each}
			</div>
		</div>
	</div>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
</div>
<CodeBlock class="mt-3" lang="svelte" code={exampleCode} />
