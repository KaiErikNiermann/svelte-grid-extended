<script lang="ts">
	import NavLink from './NavLink.svelte';
	import { cn } from '$lib/utils';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';

	interface NavSection {
		title: string;
		items: { href: RouteId; label: string }[];
	}

	const sections: NavSection[] = [
		{
			title: 'Getting Started',
			items: [
				{ href: '/docs', label: 'Introduction' },
				{ href: '/docs/installation', label: 'Installation' },
				{ href: '/docs/quickstart', label: 'Quick Start' }
			]
		},
		{
			title: 'Core Concepts',
			items: [
				{ href: '/docs/grid', label: 'Grid Component' },
				{ href: '/docs/grid-item', label: 'GridItem Component' },
				{ href: '/docs/controller', label: 'Grid Controller' }
			]
		},
		{
			title: 'Features',
			items: [
				{ href: '/docs/static-grid', label: 'Static Grid' },
				{ href: '/docs/collision', label: 'Collision Behavior' },
				{ href: '/docs/styling', label: 'Styling' },
				{ href: '/docs/events', label: 'Events' },
				{ href: '/docs/customization', label: 'Customization' }
			]
		},
		{
			title: 'Examples',
			items: [
				{ href: '/examples', label: 'Overview' },
				{ href: '/examples/basic', label: 'Basic' },
				{ href: '/examples/static-grid', label: 'Static Grid' },
				{ href: '/examples/without-bounds', label: 'Without Bounds' },
				{ href: '/examples/styling', label: 'Styling' },
				{ href: '/examples/customization', label: 'Customization' },
				{ href: '/examples/readonly', label: 'Read Only' },
				{ href: '/examples/binding', label: 'Two Way Binding' },
				{ href: '/examples/events', label: 'Events' },
				{ href: '/examples/collision-push', label: 'Collision Push' },
				{ href: '/examples/collision-compress', label: 'Collision Compress' },
				{ href: '/examples/add-remove-item', label: 'Add/Remove Items' }
			]
		}
	];

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<nav class={cn('space-y-6', className)}>
	{#each sections as section}
		<div>
			<h4 class="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
				{section.title}
			</h4>
			<div class="space-y-1">
				{#each section.items as item}
					<NavLink href={resolve(item.href)}>
						{item.label}
					</NavLink>
				{/each}
			</div>
		</div>
	{/each}
</nav>
