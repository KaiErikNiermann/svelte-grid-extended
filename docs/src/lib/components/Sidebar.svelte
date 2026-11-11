<script lang="ts">
	import NavLink from './NavLink.svelte';
	import { cn } from '#lib/utils/index.ts';
	import { routeHref } from '#lib/route-href.ts';
	import { navSections } from '#lib/nav.ts';

	interface Props {
		class?: string;
		/** Called when a link is followed; the mobile menu closes on it. */
		onfollow?: () => void;
	}

	let { class: className, onfollow }: Props = $props();
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
					<NavLink href={routeHref(item.href)} {onfollow}>
						{item.label}
					</NavLink>
				{/each}
			</div>
		</div>
	{/each}
</nav>
