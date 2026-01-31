<script lang="ts">
	import Grid, { GridItem } from '@appulsauce/svelte-grid';
	import { CodeBlock } from '$lib/components';

	let readOnly = $state(true);
</script>

<svelte:head>
	<title>Read Only Example - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Read Only</h1>
	<p>Set <code>readOnly</code> on the Grid to disable all interactions, or use <code>movable</code> and <code>resizable</code> on individual items for fine-grained control.</p>
</div>

<div class="mb-4">
	<label class="inline-flex items-center gap-2 cursor-pointer">
		<input type="checkbox" bind:checked={readOnly} class="rounded border-border" />
		<span class="text-sm">Read-only mode</span>
	</label>
</div>

<div class="border border-border rounded-lg p-4 bg-muted/30">
	<Grid cols={10} rows={10} {readOnly}>
		<GridItem x={0} y={0} w={3} h={3} class="grid-demo-item bg-primary/20 border border-primary/40 rounded">
			{#snippet children()}Item A{/snippet}
		</GridItem>
		<GridItem x={3} y={0} w={3} h={3} class="grid-demo-item bg-primary/20 border border-primary/40 rounded">
			{#snippet children()}Item B{/snippet}
		</GridItem>
		<GridItem x={6} y={0} w={3} h={3} class="grid-demo-item bg-primary/20 border border-primary/40 rounded">
			{#snippet children()}Item C{/snippet}
		</GridItem>
	</Grid>
</div>

<div class="mt-6 prose">
	<h3>Grid-level Read Only</h3>
	<CodeBlock
		class="mt-3"
		lang="svelte"
		code={`<Grid cols={10} rows={10} readOnly>
  <!-- All items are non-interactive -->
</Grid>`}
	/>

	<h3>Per-item Control</h3>
	<CodeBlock
		class="mt-3"
		lang="svelte"
		code={`<Grid cols={10} rows={10}>
  <!-- Can't be moved, but can be resized -->
  <GridItem x={0} y={0} movable={false}>...</GridItem>

  <!-- Can be moved, but can't be resized -->
  <GridItem x={2} y={0} resizable={false}>...</GridItem>

  <!-- Completely static -->
  <GridItem x={4} y={0} movable={false} resizable={false}>...</GridItem>
</Grid>`}
	/>
</div>
