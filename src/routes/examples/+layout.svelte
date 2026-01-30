<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="layout">
	{@render children()}
</div>

<style>
	.layout {
		height: 100vh;
	}
</style>
