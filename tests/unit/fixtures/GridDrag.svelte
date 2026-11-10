<script lang="ts">
	import Grid from '../../../src/lib/Grid.svelte';
	import GridItem from '../../../src/lib/GridItem.svelte';
	import DropOnMount from './DropOnMount.svelte';

	let {
		show = false,
		dropOnReveal = false
	}: {
		show?: boolean;
		dropOnReveal?: boolean;
	} = $props();

	let x = $state(0);
	let y = $state(0);

	export function position() {
		return { x, y };
	}
</script>

<Grid cols={4} rows={4} gap={0} itemSize={{ width: 100, height: 100 }}>
	<GridItem id="dragged" class="dragged" previewClass="preview" bind:x bind:y />

	{#if show}
		<GridItem id="revealed" x={1} y={0} />
		{#if dropOnReveal}
			<DropOnMount />
		{/if}
	{/if}
</Grid>
