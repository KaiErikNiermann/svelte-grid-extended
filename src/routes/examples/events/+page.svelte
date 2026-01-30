<script lang="ts">
	import Grid, { type LayoutChangeDetail } from '$lib';
	import GridItem from '$lib/GridItem.svelte';

	function logItem(detail: LayoutChangeDetail) {
		console.log(detail.item);
	}
</script>

<Grid cols={10} rows={10} onchange={logItem}>
	<GridItem x={1} y={0} class="item" onchange={logItem}>
		{#snippet children()}Hey{/snippet}
	</GridItem>
	<GridItem x={3} y={3} w={4} class="item" onpreviewchange={logItem}>
		{#snippet children()}Hoy{/snippet}
	</GridItem>
</Grid>

<style>
	:global(.item) {
		display: grid;
		place-items: center;
		background-color: rgb(150, 150, 150);
		width: 100%;
		height: 100%;
		font-size: xx-large;
	}
</style>
