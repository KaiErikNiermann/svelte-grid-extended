<script lang="ts">
	import Grid from '../../../src/lib/Grid.svelte';
	import GridItem from '../../../src/lib/GridItem.svelte';

	let {
		collision,
		show = false
	}: {
		collision: 'none' | 'push' | 'compress';
		show?: boolean;
	} = $props();

	let x = $state(0);
	let y = $state(0);

	export function position() {
		return { x, y };
	}
</script>

<Grid cols={4} rows={4} itemSize={{ width: 25, height: 25 }} {collision} autoCompress={false}>
	<GridItem id="existing" x={0} y={0} w={2} h={2} />
	{#if show}
		<GridItem id="revealed" bind:x bind:y w={2} h={2} />
	{/if}
</Grid>
