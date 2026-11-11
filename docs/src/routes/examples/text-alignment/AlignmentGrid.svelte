<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { onMount, tick } from 'svelte';
	import { measureLabel, type Alignment, type TextLine } from './measure';

	let { alignment, trim, guides }: { alignment: Alignment; trim: boolean; guides: boolean } =
		$props();

	const fonts = [
		{ id: 'sans', name: 'Inter 14px', text: 'Revenue' },
		{ id: 'mono', name: 'Monospace 14px', text: 'CPU 42%' },
		{ id: 'serif', name: 'Serif 16px', text: 'Notes' },
		{ id: 'heading', name: 'Inter 22px semibold', text: 'Q3 Report' }
	] as const;

	let items = $state(fonts.map((f, i) => ({ id: f.id, x: i, y: 0, w: 1, h: 1 })));
	let wrap: HTMLDivElement;
	let lines = $state<(TextLine & { id: string; origin: number })[]>([]);

	// Box heights differ by alignment so the top-aligned boxes show room below the text.
	const itemSize = $derived({ height: alignment === 'centre' ? 64 : 96 });

	/** Re-measures every label, at most once per frame. */
	let frame = 0;
	function remeasure() {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const origin = wrap.getBoundingClientRect().top;
			lines = [...wrap.querySelectorAll<HTMLElement>('.cell')].map((cell) => {
				const line = measureLabel(cell.querySelector<HTMLElement>('.label')!, cell, alignment);
				return { ...line, id: cell.dataset.id!, origin };
			});
		});
	}

	const nameOf = (id: string) => fonts.find((f) => f.id === id)?.name ?? id;
	const fmt = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
	// Inter-box alignment: how far apart the boxes' text lines are, in device pixels.
	const spread = $derived(
		lines.length === 0
			? 0
			: (Math.max(...lines.map((l) => l.text)) - Math.min(...lines.map((l) => l.text))) *
					window.devicePixelRatio
	);

	// The inputs that move the text or the guides; re-measure after the DOM takes each change.
	const layoutKey = $derived(`${alignment}|${trim}|${guides}`);
	$effect(() => {
		if (layoutKey) tick().then(remeasure);
	});

	onMount(() => {
		const observer = new ResizeObserver(remeasure);
		observer.observe(wrap);
		document.fonts.ready.then(remeasure);
		// Items animate into place after a drag; measure where they end up.
		wrap.addEventListener('transitionend', remeasure);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<div class="flex flex-col gap-3">
	<div
		class="alignment-grid demo-panel"
		bind:this={wrap}
		data-trim={trim ? 'on' : 'off'}
		data-align={alignment}
	>
		<Grid class="grid-compact" cols={4} {itemSize} gap={8} collision="none">
			{#each items as it (it.id)}
				<GridItem
					id={it.id}
					bind:x={it.x}
					bind:y={it.y}
					bind:w={it.w}
					bind:h={it.h}
					class="grid-demo-item"
					onchange={remeasure}
				>
					<div class="cell" data-id={it.id} data-font={it.id}>
						<span class="label">{fonts.find((f) => f.id === it.id)?.text}</span>
					</div>
				</GridItem>
			{/each}
		</Grid>
		{#if guides}
			<!-- One line per box at its text, one dashed line per box where the text should be. -->
			{#each lines as line (line.id)}
				<div
					class="guide guide-target"
					style:inset-block-start="{line.target - line.origin}px"
				></div>
				<div class="guide guide-text" style:inset-block-start="{line.text - line.origin}px"></div>
			{/each}
		{/if}
	</div>
	<dl class="readout">
		{#each lines as line (line.id)}
			<dt>{nameOf(line.id)}</dt>
			<dd>
				{fmt(line.offsetDevicePx)} device px from the box {alignment === 'centre'
					? 'centre'
					: 'content top'}
			</dd>
		{/each}
		<dt>Across the boxes</dt>
		<dd>text lines {spread.toFixed(2)} device px apart</dd>
	</dl>
</div>

<style>
	.alignment-grid {
		position: relative;
	}

	.cell {
		inline-size: 100%;
		block-size: 100%;
		line-height: 1.4;
	}

	.alignment-grid[data-align='centre'] .cell {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.alignment-grid[data-align='top'] .cell {
		padding-block-start: 0.75rem;
		padding-inline: 0.75rem;
	}

	/* A block, so `text-box` can trim its first and last line. */
	.label {
		display: block;
	}

	.cell[data-font='sans'] {
		font-size: 0.875rem;
	}

	.cell[data-font='mono'] {
		font-family: ui-monospace, 'Liberation Mono', monospace;
		font-size: 0.875rem;
	}

	.cell[data-font='serif'] {
		font-family: ui-serif, Georgia, serif;
		font-size: 1rem;
	}

	.cell[data-font='heading'] {
		font-size: 1.375rem;
		font-weight: 600;
	}

	/* Trim each label's line box to cap height and alphabetic baseline: centring or padding the
	   box then places the letters themselves. Browsers without text-box keep the full line box. */
	@supports (text-box: trim-both cap alphabetic) {
		.alignment-grid[data-trim='on'] .label {
			text-box: trim-both cap alphabetic;
		}
	}

	.guide {
		position: absolute;
		inset-inline: 0;
		block-size: 0;
		pointer-events: none;
	}

	.guide-text {
		border-block-start: 1px solid hsl(var(--primary) / 0.6);
	}

	.guide-target {
		border-block-start: 1px dashed hsl(var(--muted-foreground) / 0.6);
	}

	.readout {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.25rem 1rem;
		font-size: 0.8125rem;
	}

	.readout dt {
		color: hsl(var(--muted-foreground));
	}

	.readout dd {
		margin: 0;
		font-family: ui-monospace, monospace;
	}
</style>
