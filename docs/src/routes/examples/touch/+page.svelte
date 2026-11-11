<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import {
		Calendar,
		Clock,
		CloudSun,
		Footprints,
		Image,
		Mail,
		Map,
		MoveDiagonal2,
		Music,
		StickyNote,
		Timer
	} from 'lucide-svelte';
	import { CodeBlock } from '#lib/components/index.ts';
	import { scriptClose } from '#lib/snippet-utils.ts';

	const ICONS = {
		Calendar,
		Clock,
		CloudSun,
		Footprints,
		Image,
		Mail,
		Map,
		Music,
		StickyNote,
		Timer
	};

	type Card = {
		id: string;
		icon: keyof typeof ICONS;
		label: string;
		detail: string;
		x: number;
		y: number;
		w: number;
		h: number;
	};

	const cards = $state<Card[]>([
		{
			id: 'weather',
			icon: 'CloudSun',
			label: 'Weather',
			detail: '14°',
			x: 0,
			y: 0,
			w: 2,
			h: 1
		},
		{
			id: 'calendar',
			icon: 'Calendar',
			label: 'Calendar',
			detail: '3 events',
			x: 2,
			y: 0,
			w: 2,
			h: 2
		},
		{ id: 'clock', icon: 'Clock', label: 'Clock', detail: '16:54', x: 0, y: 1, w: 1, h: 1 },
		{ id: 'steps', icon: 'Footprints', label: 'Steps', detail: '6,240', x: 1, y: 1, w: 1, h: 1 },
		{ id: 'music', icon: 'Music', label: 'Music', detail: 'Paused', x: 0, y: 2, w: 2, h: 1 },
		{ id: 'mail', icon: 'Mail', label: 'Mail', detail: '2 new', x: 2, y: 2, w: 1, h: 1 },
		{ id: 'timer', icon: 'Timer', label: 'Timer', detail: '5:00', x: 3, y: 2, w: 1, h: 1 },
		{ id: 'photos', icon: 'Image', label: 'Photos', detail: '128 new', x: 0, y: 3, w: 2, h: 2 },
		{
			id: 'notes',
			icon: 'StickyNote',
			label: 'Notes',
			detail: 'Groceries',
			x: 2,
			y: 3,
			w: 2,
			h: 1
		},
		{ id: 'maps', icon: 'Map', label: 'Maps', detail: '12 min', x: 2, y: 4, w: 2, h: 1 }
	]);

	const DELAYS = [
		{ value: 300, label: 'Hold 300 ms' },
		{ value: 500, label: 'Hold 500 ms' },
		{ value: 0, label: 'At first touch' }
	];
	let touchDelay = $state(300);

	const exampleCode = String.raw`<script lang="ts">
  import Grid, { GridItem } from '@appulsauce/svelte-grid';
${scriptClose}

<!-- A finger held for touchDelay lifts a card; a swipe scrolls the page. -->
<Grid cols={4} itemSize={{ height: 112 }} gap={8} collision="shift" touchDelay={300}>
  {#each cards as card (card.id)}
    <GridItem
      bind:x={card.x} bind:y={card.y} bind:w={card.w} bind:h={card.h}
      class="touch-card"
      activeClass="touch-card touch-card-lifted"
      previewClass="touch-card-preview"
    >
      {#snippet children()}
        <span class="label">{card.label}</span>
      {/snippet}

      <!-- touch-none: the browser cannot scroll from here, so a finger resizes at once. -->
      {#snippet resizeHandle({ resizeStart })}
        <div class="touch-resize touch-none" onpointerdown={resizeStart}></div>
      {/snippet}
    </GridItem>
  {/each}
</Grid>

<style>
  /* The grid marks a card with data-holding while a finger is held: fill a bar over touchDelay. */
  :global(.touch-card)::after { content: ''; position: absolute; inset-inline: 0; inset-block-end: 0;
    block-size: 4px; background: green; transform: scaleX(0); transform-origin: left; }
  :global(.touch-card[data-holding])::after { transform: scaleX(1); transition: transform 300ms linear; }
  :global(.touch-card-lifted) { transform: scale(1.04); box-shadow: 0 12px 24px rgb(0 0 0 / 0.2); }
  .touch-resize { position: absolute; inset-inline-end: 0; inset-block-end: 0;
    inline-size: min(44px, 50%); block-size: min(44px, 50%); }
</style>`;
</script>

<svelte:head>
	<title>Touch Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Touch</h1>
	<p>
		A board of cards built for fingers. Open this page on a phone or tablet (or in your browser's
		device mode) and try:
	</p>
	<ul>
		<li>
			Swipe up or down over the cards: the page scrolls, and nothing moves. A grid that fills the
			screen never traps the reader.
		</li>
		<li>
			Hold a finger on a card: the bar along its bottom fills, the card lifts, and it follows the
			finger. Neighbours make way, as icons do on a phone's home screen (<code
				>collision="shift"</code
			>).
		</li>
		<li>
			Drag the corner of a card: the handle has <code>touch-action: none</code>, so it resizes at
			the first touch, and it is the size of a fingertip.
		</li>
		<li>Put a second finger down while a card is lifted: it is ignored.</li>
	</ul>
	<p>
		With a mouse, cards drag at once. "At first touch" sets <code>touchDelay={0}</code>, for boards
		that never need to scroll the page: cards then drag at the first touch, and the page can no
		longer be scrolled from them.
	</p>
</div>

<fieldset class="touch-delays mb-4">
	<legend class="sr-only">How a touch drag starts</legend>
	{#each DELAYS as delay (delay.value)}
		<label>
			<input type="radio" name="touch-delay" value={delay.value} bind:group={touchDelay} />
			{delay.label}
		</label>
	{/each}
</fieldset>

<div class="demo-panel touch-demo" style={`--hold: ${touchDelay}ms`}>
	<Grid cols={4} itemSize={{ height: 112 }} gap={8} collision="shift" {touchDelay}>
		{#each cards as card (card.id)}
			{@const Icon = ICONS[card.icon]}
			<GridItem
				id={card.id}
				bind:x={card.x}
				bind:y={card.y}
				bind:w={card.w}
				bind:h={card.h}
				class="touch-card"
				activeClass="touch-card touch-card-lifted"
				previewClass="touch-card-preview"
			>
				{#snippet children()}
					<span class="touch-card-body">
						<Icon size={24} aria-hidden="true" />
						<span class="touch-card-label">{card.label}</span>
						<span class="touch-card-detail">{card.detail}</span>
					</span>
				{/snippet}

				{#snippet resizeHandle({ resizeStart })}
					<div
						class="touch-resize touch-none"
						role="button"
						tabindex="-1"
						aria-label={`Resize ${card.label}`}
						onpointerdown={resizeStart}
					>
						<MoveDiagonal2 size={16} aria-hidden="true" />
					</div>
				{/snippet}
			</GridItem>
		{/each}
	</Grid>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
</div>
<CodeBlock class="mt-3" lang="svelte" code={exampleCode} />

<style>
	.touch-delays {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* Radio choices as touch-sized chips. */
	.touch-delays label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-block-size: 44px;
		padding-inline: 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		font-size: 0.9375rem;
		cursor: pointer;
	}

	.touch-delays label:has(input:checked) {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.1);
	}

	.touch-demo :global(.touch-card) {
		position: relative;
		overflow: hidden;
		border: 1px solid hsl(var(--border));
		border-radius: calc(var(--radius) * 2);
		background: hsl(var(--card));
		color: hsl(var(--card-foreground));
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
		-webkit-tap-highlight-color: transparent;
		/* left and top are GridItem's own, for cards making way; this rule replaces its list. */
		transition:
			left 200ms ease-in-out,
			top 200ms ease-in-out,
			transform 150ms ease-out,
			box-shadow 150ms ease-out;
	}

	/* The hold bar: it fills over touchDelay while a finger is held (the grid marks the card with
	   data-holding then), and the card lifts when it is full. A mouse drags at once, and with no
	   delay a touch does too, so neither shows it. */
	.touch-demo :global(.touch-card)::after {
		content: '';
		position: absolute;
		inset-inline: 0;
		inset-block-end: 0;
		block-size: 4px;
		background: hsl(var(--primary));
		transform: scaleX(0);
		transform-origin: left;
	}

	.touch-demo :global(.touch-card[data-holding])::after {
		transform: scaleX(1);
		transition: transform var(--hold) linear;
	}

	.touch-demo :global(.touch-card-lifted) {
		z-index: 1;
		/* Not left and top: the lifted card follows the finger without lag. */
		transition:
			transform 150ms ease-out,
			box-shadow 150ms ease-out;
		transform: scale(1.04);
		box-shadow: 0 12px 24px rgb(0 0 0 / 0.2);
	}

	.touch-demo :global(.touch-card-lifted)::after {
		opacity: 0;
	}

	.touch-demo :global(.touch-card-preview) {
		border: 2px dashed hsl(var(--primary));
		border-radius: calc(var(--radius) * 2);
		background: hsl(var(--primary) / 0.08);
	}

	.touch-demo :global(.touch-card-body) {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		block-size: 100%;
		/* The bottom strip is the resize handle's, so text never runs under its mark. */
		padding: 0.75rem 0.5rem 1.75rem;
	}

	.touch-demo :global(.touch-card-label) {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.touch-demo :global(.touch-card-detail) {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	/* A fingertip-sized target, but at most half a small card, with a small mark in the corner. */
	.touch-demo :global(.touch-resize) {
		position: absolute;
		inset-inline-end: 0;
		inset-block-end: 0;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		inline-size: min(44px, 50%);
		block-size: min(44px, 50%);
		padding: 0.375rem;
		color: hsl(var(--muted-foreground));
		cursor: se-resize;
	}
</style>
