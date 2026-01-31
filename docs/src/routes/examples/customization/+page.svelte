<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';
	import { GripVertical, Maximize2 } from 'lucide-svelte';
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
</div>

<div class="demo-panel">
	<Grid cols={10} rows={10}>
		<!-- Both custom handles -->
		<GridItem
			x={0}
			y={0}
			w={3}
			h={4}
			class="flex flex-col bg-card border border-border rounded-lg overflow-hidden"
		>
			{#snippet moveHandle({ moveStart })}
				<div
					class="flex items-center gap-2 p-2 bg-muted border-b border-border cursor-move"
					role="button"
					tabindex="0"
					onpointerdown={moveStart}
				>
					<GripVertical class="h-4 w-4 text-muted-foreground" />
					<span class="text-sm font-medium">Drag header</span>
				</div>
			{/snippet}

			{#snippet children()}
				<div class="flex-1 p-3 text-sm text-muted-foreground">
					This card has both custom move and resize handles.
				</div>
			{/snippet}

			{#snippet resizeHandle({ resizeStart })}
				<div
					class="absolute bottom-1 right-1 p-1 rounded bg-muted hover:bg-accent cursor-se-resize"
					role="button"
					tabindex="0"
					onpointerdown={resizeStart}
				>
					<Maximize2 class="h-3 w-3 text-muted-foreground" />
				</div>
			{/snippet}
		</GridItem>

		<!-- Only custom move handle -->
		<GridItem
			x={3}
			y={0}
			w={3}
			h={4}
			class="flex flex-col bg-card border border-border rounded-lg overflow-hidden"
		>
			{#snippet moveHandle({ moveStart })}
				<div
					class="flex items-center gap-2 p-2 bg-muted border-b border-border cursor-move"
					role="button"
					tabindex="0"
					onpointerdown={moveStart}
				>
					<GripVertical class="h-4 w-4 text-muted-foreground" />
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
		<GridItem
			x={6}
			y={0}
			w={3}
			h={4}
			class="grid-demo-item rounded-lg"
		>
			{#snippet children()}
				<div class="text-center p-2">
					<div class="font-medium">Default</div>
					<div class="text-xs text-muted-foreground">Whole item is draggable</div>
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
	code={`<GridItem x={0} y={0} w={3} h={4}>
  {#snippet moveHandle({ moveStart })}
    <div onpointerdown={moveStart} class="cursor-move">
      Drag here
    </div>
  {/snippet}

  {#snippet children()}
    <div>Content area</div>
  {/snippet}

  {#snippet resizeHandle({ resizeStart })}
    <button onpointerdown={resizeStart} class="cursor-se-resize">
      ↘
    </button>
  {/snippet}
</GridItem>`}
/>
