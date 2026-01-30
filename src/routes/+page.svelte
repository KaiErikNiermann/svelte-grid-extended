<script lang="ts">
	import Grid, { GridItem } from '$lib';

	const items = [
		{ id: '0', x: 0, y: 0, w: 1, h: 1, max: { w: 2, h: 1 } },
		{ id: '3', x: 0, y: 1, w: 3, h: 1 }
	];

	const cols = { xxl: 6, xl: 5, lg: 4, md: 3, sm: 2, xs: 1 };
	const itemSize = { height: 100 };
</script>

<Grid class="container" {cols} {itemSize} bounds={true}>
	{#each items as item}
		<GridItem x={item.x} y={item.y} w={item.w} h={item.h} max={item.max}>
			{#snippet children()}
				<div class="item">{item.id}</div>
			{/snippet}
		</GridItem>
	{/each}
</Grid>

<style>
	:global(.container) {
		max-width: 900px;
		height: 100vh;
		background-color: aquamarine;
	}

	.item {
		display: grid;
		place-items: center;
		background-color: rgb(150, 150, 150);
		width: 100%;
		height: 100%;
	}
</style>
