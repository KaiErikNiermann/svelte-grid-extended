<script lang="ts">
	import { onMount } from 'svelte';
	import { routeHref } from '#lib/route-href.ts';
	import AlignmentGrid from './AlignmentGrid.svelte';
	import { supportsTrim } from './measure';

	let trim = $state(true);
	let guides = $state(true);
	let trimSupported = $state(true);

	onMount(() => {
		trimSupported = supportsTrim();
	});

	const stylingDocs = routeHref('/docs/styling');
</script>

<svelte:head>
	<title>Text Alignment Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Text Alignment</h1>
	<p>
		Centring a box does not centre the letters in it. A line of text is as tall as its line box,
		which includes room above the capitals and below the baseline that the letters do not fill, and
		that room differs from font to font. So labels in boxes of the same height sit at different
		heights, and the top lines of top-aligned labels do not line up either. The guides below show
		it: a solid line marks where each box's text sits, a dashed line where it should sit. When the
		text lines up, all of them fall on one line.
	</p>
	<p>
		The fix is <code>text-box: trim-both cap alphabetic</code> on a block around the text: it trims
		the line box to the capital height and the baseline, so centring or padding the box places the
		letters themselves. It works the same inside grid items as anywhere else; the
		<a href={stylingDocs}>styling docs</a> explain how to apply it.
	</p>
</div>

<div class="flex flex-col gap-8">
	<div class="flex flex-wrap gap-4">
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={trim} />
			Trim text to cap height and baseline
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={guides} />
			Show alignment guides
		</label>
	</div>

	{#if !trimSupported}
		<p class="note text-sm">
			This browser does not support <code>text-box</code>, so the trim does nothing here and the
			labels keep their offsets. Chrome and Edge support it since version 133, Safari since 18.2 and
			Firefox since 154.
		</p>
	{/if}

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold">Centred labels</h2>
		<p class="text-sm text-muted-foreground">
			Boxes of the same height: each label should sit on its box's centre, and all four on one line.
		</p>
		<AlignmentGrid alignment="centre" {trim} {guides} />
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold">Top-aligned labels</h2>
		<p class="text-sm text-muted-foreground">
			Boxes with the same top and the same padding: the tops of the capitals should sit on the
			padding line, and all four on one line.
		</p>
		<AlignmentGrid alignment="top" {trim} {guides} />
	</section>
</div>

<style>
	.note {
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.5);
	}
</style>
