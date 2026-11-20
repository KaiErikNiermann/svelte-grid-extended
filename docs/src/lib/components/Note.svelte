<!--
  A flat tinted admonition with a title row, styled by `.admonition` in app.css. The Markdown
  pages get the same markup from tooling/rehype-admonition.ts.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'note' | 'tip' | 'important' | 'warning' | 'caution';
		/** The title row; the type's name when left out. */
		title?: string;
		children: Snippet;
	}

	let { type = 'note', title, children }: Props = $props();
	const label = $derived(title ?? type.charAt(0).toUpperCase() + type.slice(1));
</script>

<aside class="admonition {type}">
	<p class="admonition-title">{label}</p>
	{@render children()}
</aside>
