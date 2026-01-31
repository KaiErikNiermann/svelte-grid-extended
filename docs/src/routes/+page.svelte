<script lang="ts">
	import { ArrowRight, Grid3x3, Move, Maximize2, Zap } from 'lucide-svelte';
	import { CodeBlock } from '$lib/components';
	import { resolve } from '$app/paths';

	const docsPath = resolve('/docs');
	const examplesPath = resolve('/examples');

	const quickExampleCode = String.raw`<script lang="ts">
  import Grid, { GridItem } from '@appulsauce/svelte-grid';

  let items = $state([
    { id: '1', x: 0, y: 0, w: 2, h: 2 },
    { id: '2', x: 2, y: 0, w: 3, h: 1 }
  ]);
</script>

<Grid cols={10} rows={10}>
  {#each items as item (item.id)}
    <GridItem bind:x={item.x} bind:y={item.y} bind:w={item.w} bind:h={item.h}>
      {#snippet children()}
        <div class="item">{item.id}</div>
      {/snippet}
    </GridItem>
  {/each}
</Grid>`;
</script>

<svelte:head>
	<title>Svelte Grid - Draggable and Resizable Grid for Svelte 5</title>
</svelte:head>

<div class="max-w-4xl">
	<!-- Hero -->
	<div class="mb-12">
		<h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-4">Svelte Grid</h1>
		<p class="text-xl text-muted-foreground mb-6">
			A draggable and resizable grid layout component for Svelte 5. Build dynamic, interactive
			dashboards and layouts with ease.
		</p>
		<div class="flex flex-wrap gap-3">
			<a
				href={docsPath}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
			>
				Get Started
				<ArrowRight class="h-4 w-4" />
			</a>
			<a
				href={examplesPath}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
			>
				View Examples
			</a>
		</div>
	</div>

	<!-- Install -->
	<div class="mb-12 p-4 rounded-lg bg-muted">
		<code class="text-sm font-mono">npm install @appulsauce/svelte-grid</code>
	</div>

	<!-- Features -->
	<div class="grid gap-6 md:grid-cols-2 mb-12">
		<div class="p-6 rounded-lg border border-border">
			<div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
				<Move class="h-5 w-5 text-primary" />
			</div>
			<h3 class="font-semibold mb-2">Draggable Items</h3>
			<p class="text-sm text-muted-foreground">
				Smoothly drag and drop grid items with touch and mouse support. Custom drag handles
				available.
			</p>
		</div>

		<div class="p-6 rounded-lg border border-border">
			<div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
				<Maximize2 class="h-5 w-5 text-primary" />
			</div>
			<h3 class="font-semibold mb-2">Resizable Items</h3>
			<p class="text-sm text-muted-foreground">
				Resize items with customizable min/max constraints. Supports custom resize handles.
			</p>
		</div>

		<div class="p-6 rounded-lg border border-border">
			<div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
				<Grid3x3 class="h-5 w-5 text-primary" />
			</div>
			<h3 class="font-semibold mb-2">Flexible Grid</h3>
			<p class="text-sm text-muted-foreground">
				Static or dynamic grids with customizable rows, columns, gaps, and item sizes.
			</p>
		</div>

		<div class="p-6 rounded-lg border border-border">
			<div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
				<Zap class="h-5 w-5 text-primary" />
			</div>
			<h3 class="font-semibold mb-2">Collision Handling</h3>
			<p class="text-sm text-muted-foreground">
				Multiple collision strategies: none, push, or compress. Keep your layout organized
				automatically.
			</p>
		</div>
	</div>

	<!-- Quick Example -->
	<div class="mb-12">
		<h2 class="text-2xl font-semibold mb-4">Quick Example</h2>
		<CodeBlock class="mt-4" lang="svelte" code={quickExampleCode} />
	</div>

	<!-- Built for Svelte 5 -->
	<div class="p-6 rounded-lg border border-primary/20 bg-primary/5">
		<h3 class="font-semibold mb-2">Built for Svelte 5</h3>
		<p class="text-sm text-muted-foreground">
			This library is built specifically for Svelte 5 with runes-based reactivity. Enjoy modern
			Svelte features like <code class="bg-muted px-1 rounded">$state</code>,
			<code class="bg-muted px-1 rounded">$derived</code>, and snippets.
		</p>
	</div>
</div>
