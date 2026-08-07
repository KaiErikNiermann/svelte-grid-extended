<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	interface Props {
		href: string;
		children: import('svelte').Snippet;
	}

	let { href, children }: Props = $props();

	// Trailing slashes are trimmed without a regex: `/\/+$/` backtracks super-linearly
	// on a run of slashes, and sonarjs rejects it.
	const normalizePath = (path: string) => {
		if (path === '/') return path;
		let normalized = path;
		while (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
		return normalized;
	};

	const isActive = $derived(normalizePath(page.url.pathname) === normalizePath(href));
</script>

<a
	{href}
	class={cn(
		'block px-3 py-2 text-sm rounded-md transition-colors',
		isActive
			? 'bg-primary/10 text-primary font-medium'
			: 'text-muted-foreground hover:text-foreground hover:bg-accent'
	)}
>
	{@render children()}
</a>
