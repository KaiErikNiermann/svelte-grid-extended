<script lang="ts">
	import { Menu, X } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import Sidebar from './Sidebar.svelte';
	import { resolve } from '$app/paths';

	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	const homePath = resolve('/');
	const docsPath = resolve('/docs');
	const examplesPath = resolve('/examples');
</script>

<header class="sticky top-0 z-50 w-full border-b border-border bg-background/95">
	<div
		class="absolute inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pointer-events-none"
	></div>
	<div class="relative container flex h-14 items-center px-4 md:px-6">
		<button
			onclick={toggleMobileMenu}
			class="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors lg:hidden"
			aria-label="Toggle menu"
		>
			{#if mobileMenuOpen}
				<X class="h-4 w-4" />
			{:else}
				<Menu class="h-4 w-4" />
			{/if}
		</button>

		<a href={homePath} class="flex items-center gap-2 font-semibold">
			<span class="text-primary">Svelte 5 Grid</span>
		</a>

		<div class="flex-1"></div>

		<nav class="hidden md:flex items-center gap-6 text-sm">
			<a href={docsPath} class="text-muted-foreground hover:text-foreground transition-colors"
				>Docs</a
			>
			<a href={examplesPath} class="text-muted-foreground hover:text-foreground transition-colors"
				>Examples</a
			>
		</nav>

		<div class="flex items-center gap-2 ml-4">
			<a
				href="https://github.com/KaiErikNiermann/svelte-grid-extended"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
				aria-label="GitHub"
			>
				<svg
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
					/>
					<path d="M9 18c-4.51 2-5-2-7-2" />
				</svg>
			</a>
			<ThemeToggle />
		</div>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="fixed inset-0 top-14 z-40 lg:hidden" role="dialog" aria-modal="true">
			<!-- Backdrop -->
			<button
				class="fixed inset-0 bg-background/80 backdrop-blur-sm"
				onclick={closeMobileMenu}
				aria-label="Close menu"
			></button>
			<!-- Sidebar -->
			<div
				class="fixed inset-y-0 left-0 top-14 w-72 border-r border-border bg-background p-6 overflow-y-auto overscroll-contain"
			>
				<Sidebar />
			</div>
		</div>
	{/if}
</header>
