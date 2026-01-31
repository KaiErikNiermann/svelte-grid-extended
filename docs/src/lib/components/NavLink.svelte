<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	interface Props {
		href: string;
		children: import('svelte').Snippet;
	}

	let { href, children }: Props = $props();

	const normalizePath = (path: string) => (path !== '/' ? path.replace(/\/+$/, '') : path);

	const isActive = $derived(normalizePath($page.url.pathname) === normalizePath(href));
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
