<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft } from 'lucide-svelte';
	import { base } from '$app/paths';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const examplesPath = base + '/examples';
	const isExamplePage = $derived($page.url.pathname !== examplesPath);
</script>

<div class="examples-page">
	{#if isExamplePage}
		<div class="mb-6">
			<a
				href={examplesPath}
				class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to examples
			</a>
		</div>
	{/if}
	{@render children()}
</div>

<style>
	:global(.grid-demo-item) {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
