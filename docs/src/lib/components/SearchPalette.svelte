<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { navSections } from '#lib/nav.ts';
	import { routeHref } from '#lib/route-href.ts';
	import type { INinjaAction, NinjaKeys } from '../vendor/ninja-keys/ninja-keys.bundled.js';

	let palette: NinjaKeys | undefined = $state();
	let loaded: Promise<unknown> | undefined;

	const actions: INinjaAction[] = navSections.flatMap((section) =>
		section.items.map((item) => ({
			id: item.href,
			title: item.label,
			section: section.title,
			keywords: `${section.title} ${item.href}`,
			handler: () => {
				void goto(routeHref(item.href));
			}
		}))
	);

	// The component touches `HTMLElement` when it is defined, so it is loaded in the browser only;
	// the site is prerendered.
	onMount(() => {
		loaded = import('../vendor/ninja-keys/ninja-keys.bundled.js');
	});

	/** Opens the palette; waits for the component to load if the page has only just opened. */
	export async function open(): Promise<void> {
		await loaded;
		palette?.open();
	}

	$effect(() => {
		if (palette) palette.data = actions;
	});
</script>

<ninja-keys
	bind:this={palette}
	placeholder="Search the docs and examples..."
	hideBreadcrumbs
	noAutoLoadMdIcons
>
	<p slot="footer" class="palette-footer">Enter opens a page, the arrow keys move, Esc closes.</p>
</ninja-keys>

<style>
	.palette-footer {
		margin: 0;
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	/* A touch screen has no keys to hint at. */
	@media (pointer: coarse) {
		.palette-footer {
			display: none;
		}
	}

	/* Until the component is defined its slotted footer is plain content in the page's flow, and
	   it would push everything down by its height when the palette loads. */
	ninja-keys:not(:defined) {
		display: none;
	}

	/* The palette reads these from the host, so it follows the site's light and dark tokens. */
	ninja-keys {
		--ninja-width: min(40rem, calc(100vw - 2rem));
		--ninja-top: 12%;
		--ninja-font-size: 0.875rem;
		--ninja-z-index: 60;
		--ninja-text-color: hsl(var(--foreground));
		--ninja-accent-color: hsl(var(--primary));
		--ninja-modal-background: hsl(var(--background));
		--ninja-overflow-background: hsl(var(--background) / 0.6);
		--ninja-backdrop-filter: blur(4px);
		--ninja-secondary-background-color: hsl(var(--muted));
		--ninja-secondary-text-color: hsl(var(--muted-foreground));
		--ninja-selected-background: hsl(var(--accent));
		--ninja-group-text-color: hsl(var(--muted-foreground));
		--ninja-footer-background: hsl(var(--muted) / 0.4);
		--ninja-placeholder-color: hsl(var(--muted-foreground));
		--ninja-separate-border: 1px solid hsl(var(--border));
		--ninja-modal-shadow: 0 1rem 4rem hsl(0 0% 0% / 0.35);
		--ninja-actions-height: min(20rem, 50vh);
		font-family: inherit;
	}
</style>
