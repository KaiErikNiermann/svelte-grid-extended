<script lang="ts">
	import NavLink from './NavLink.svelte';
	import { cn } from '#lib/utils/index.ts';
	import { routeHref } from '#lib/route-href.ts';
	import { navSections } from '#lib/nav.ts';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<nav class={cn('flex flex-col gap-4', className)}>
	{#each navSections as section, index (section.title)}
		{#if index > 0}
			<hr class="border-border" />
		{/if}
		<div>
			<h4 class="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
				{section.title}
			</h4>
			<div class="space-y-1">
				{#each section.items as item}
					<NavLink href={routeHref(item.href)}>
						{item.label}
					</NavLink>
				{/each}
			</div>
		</div>
	{/each}
</nav>
