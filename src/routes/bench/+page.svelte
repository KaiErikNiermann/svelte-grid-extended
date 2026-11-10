<script lang="ts">
	// Benchmark page driven by bench/run.mjs; the URL parameters pick the scenario.
	import { page } from '$app/state';
	import Grid, { GridItem, type Collision } from '#lib';

	const params = page.url.searchParams;
	const grids = Number(params.get('grids') ?? 50);
	const perGrid = Number(params.get('items') ?? 20);
	const collision = (params.get('collision') ?? 'none') as Collision;
	const readOnly = params.get('readOnly') === '1';
	const cols = 8;
	// `fluid` takes the item width from the container, so the ResizeObserver sizes the grid.
	const itemSize = params.get('size') === 'fluid' ? { height: 30 } : { width: 60, height: 30 };

	// Deterministic layouts without overlaps: item i at column (2i mod cols), four per row.
	const layouts = Array.from({ length: grids }, (_, g) =>
		Array.from({ length: perGrid }, (_, i) => ({
			id: `g${g}-i${i}`,
			x: (i * 2) % cols,
			y: Math.floor((i * 2) / cols),
			w: 1 + ((g + i) % 2),
			h: 1
		}))
	);
</script>

<svelte:head><title>Grid benchmark</title></svelte:head>

<main class="bench" data-items={grids * perGrid}>
	{#each layouts as items, g (g)}
		<section>
			<h2>Grid {g}</h2>
			<Grid {cols} {itemSize} {collision} {readOnly} gap={4}>
				{#each items as it (it.id)}
					<GridItem id={it.id} x={it.x} y={it.y} w={it.w} h={it.h} class="bench-item">
						<span>{it.id}</span>
					</GridItem>
				{/each}
			</Grid>
		</section>
	{/each}
</main>

<style>
	.bench {
		max-inline-size: 900px;
		margin-inline: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		font-family: system-ui, sans-serif;
	}
	.bench :global(.bench-item) {
		background: #dbeafe;
		border: 1px solid #93c5fd;
		border-radius: 4px;
		font-size: 11px;
		overflow: hidden;
	}
</style>
