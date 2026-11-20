<!--
  A callout: a tinted block, no side bar. `tone` picks the tint.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: 'info' | 'warn';
		children: Snippet;
	}

	let { tone = 'info', children }: Props = $props();
</script>

<aside class="note" data-tone={tone}>
	{@render children()}
</aside>
