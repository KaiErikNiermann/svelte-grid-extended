<script lang="ts">
	import Grid from '../../../src/lib/Grid.svelte';
	import type { GridController } from '../../../src/lib/types';

	let { cols, rows }: { cols: number; rows: number } = $props();
	let controller = $state<GridController>();

	export function availablePosition() {
		if (!controller) throw new Error('Grid controller not initialized');
		return controller.getFirstAvailablePosition(1, 1);
	}
</script>

<Grid {cols} {rows} itemSize={{ width: 25, height: 25 }} bind:controller />
