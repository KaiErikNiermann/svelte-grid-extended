<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '#lib/components/index.ts';
	import { GripVertical, Maximize2 } from 'lucide-svelte';

	/** The thresholds to compare: the old start-on-press, the default, and a deliberate one. */
	const THRESHOLDS = [
		{ px: 0, label: '0 px' },
		{ px: 4, label: '4 px (default)' },
		{ px: 12, label: '12 px' }
	];

	let threshold = $state(4);
	let selected = $state<string>();

	const CARD = 'flex flex-col bg-card border border-border rounded-lg overflow-hidden';
	const cardClass = (id: string, base: string) =>
		`${base} ${selected === id ? 'ring-2 ring-primary' : ''}`;
</script>

<svelte:head>
	<title>Customization Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Custom Handles</h1>
	<p>
		Use the <code>moveHandle</code> and <code>resizeHandle</code> snippets to create custom drag and resize
		controls. This restricts interaction to specific elements.
	</p>
	<p>
		A handle can also be clicked. A press only starts a drag once the pointer has moved further than
		the grid's
		<code>dragThreshold</code>, so a click on a header selects its card here, and a drag by the same
		header does not. With <code>0 px</code> every press starts a drag, and no click gets through.
	</p>
</div>

<div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
	<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Drag threshold">
		<span class="text-sm font-medium">Drag threshold</span>
		{#each THRESHOLDS as option (option.px)}
			<button
				class={`btn btn-sm whitespace-nowrap ${threshold === option.px ? 'btn-primary' : 'btn-outline'}`}
				aria-pressed={threshold === option.px}
				onclick={() => (threshold = option.px)}
			>
				{option.label}
			</button>
		{/each}
	</div>
	<p class="text-sm text-muted-foreground" aria-live="polite">
		Selected: {selected ?? 'none'}
	</p>
</div>

<div class="demo-panel">
	<Grid cols={10} rows={10} dragThreshold={threshold}>
		<!-- Both custom handles -->
		<GridItem x={0} y={0} w={3} h={4} class={cardClass('Drag header', CARD)}>
			{#snippet moveHandle({ moveStart })}
				<div
					class="flex items-center gap-2 p-2 bg-muted border-b border-border cursor-move touch-none"
					role="button"
					tabindex="0"
					onpointerdown={moveStart}
					onclick={() => (selected = 'Drag header')}
					onkeydown={(event) => event.key === 'Enter' && (selected = 'Drag header')}
				>
					<GripVertical class="h-4 w-4 shrink-0 text-muted-foreground" />
					<span class="text-sm font-medium">Drag header</span>
				</div>
			{/snippet}

			{#snippet children()}
				<div class="flex-1 p-3 text-sm text-muted-foreground">
					Click the header to select this card, or drag it to move the card.
				</div>
			{/snippet}

			{#snippet resizeHandle({ resizeStart })}
				<div
					class="absolute bottom-1 right-1 p-1 rounded bg-muted hover:bg-accent cursor-se-resize touch-none"
					role="button"
					tabindex="0"
					onpointerdown={resizeStart}
				>
					<Maximize2 class="h-3 w-3 shrink-0 text-muted-foreground" />
				</div>
			{/snippet}
		</GridItem>

		<!-- Only custom move handle -->
		<GridItem x={3} y={0} w={3} h={4} class={cardClass('Drag only', CARD)}>
			{#snippet moveHandle({ moveStart })}
				<div
					class="flex items-center gap-2 p-2 bg-muted border-b border-border cursor-move touch-none"
					role="button"
					tabindex="0"
					onpointerdown={moveStart}
					onclick={() => (selected = 'Drag only')}
					onkeydown={(event) => event.key === 'Enter' && (selected = 'Drag only')}
				>
					<GripVertical class="h-4 w-4 shrink-0 text-muted-foreground" />
					<span class="text-sm font-medium">Drag only</span>
				</div>
			{/snippet}

			{#snippet children()}
				<div class="flex-1 p-3 text-sm text-muted-foreground">
					Custom move handle, default resize.
				</div>
			{/snippet}
		</GridItem>

		<!-- Default (whole item draggable) -->
		<GridItem x={6} y={0} w={3} h={4} class={cardClass('Default', 'grid-demo-item rounded-lg')}>
			{#snippet children()}
				<div
					class="flex size-full flex-col items-center justify-center p-2 text-center"
					role="button"
					tabindex="0"
					onclick={() => (selected = 'Default')}
					onkeydown={(event) => event.key === 'Enter' && (selected = 'Default')}
				>
					<div class="font-medium">Default</div>
					<div class="text-xs text-muted-foreground">Whole item is draggable and clickable</div>
				</div>
			{/snippet}
		</GridItem>
	</Grid>
</div>

<div class="mt-6 prose">
	<h3>Code</h3>
</div>
<CodeBlock
	class="mt-3"
	lang="svelte"
	code={`<Grid dragThreshold={4}>
  <GridItem x={0} y={0} w={3} h={4}>
    {#snippet moveHandle({ moveStart })}
      <div
        onpointerdown={moveStart}
        onclick={() => select(id)}
        class="cursor-move touch-none"
      >
        Drag here, or click to select
      </div>
    {/snippet}

    {#snippet children()}
      <div>Content area</div>
    {/snippet}

    {#snippet resizeHandle({ resizeStart })}
      <button onpointerdown={resizeStart} class="cursor-se-resize touch-none">
        ↘
      </button>
    {/snippet}
  </GridItem>
</Grid>`}
/>
