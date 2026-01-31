<script lang="ts">
	import Grid, { GridItem } from '$lib';

	let items = $state([
		{ id: '1', x: 6, y: 0, w: 2, h: 2, data: { text: 'A' } },
		{ id: '2', x: 6, y: 2, w: 2, h: 2, data: { text: 'B' } }
	]);

	let itemsBackup = $state<typeof items>([]);
	let hasItemsBackup = $state(false);

	$effect(() => {
		if (!hasItemsBackup) {
			itemsBackup = $state.snapshot(items);
			hasItemsBackup = true;
		}
	});

	const itemSize = { height: 40 };

	function resetGrid() {
		items = structuredClone(itemsBackup);
	}
</script>

{JSON.stringify(items)}

<button onclick={resetGrid}> RESET </button>

<Grid cols={10} {itemSize} collision="push">
	{#each items as item (item.id)}
		<GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
			{#snippet children()}
				<div class="item">{item.data.text}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>

<style>
	.item {
		display: grid;
		place-items: center;
		background-color: rgb(150, 150, 150);
		width: 100%;
		height: 100%;
		font-size: xx-large;
	}
</style>
