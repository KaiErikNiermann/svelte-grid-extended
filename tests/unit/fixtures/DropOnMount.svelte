<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		window.dispatchEvent(new MouseEvent('pointerup'));
	});
</script>
