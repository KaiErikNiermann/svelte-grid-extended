<script lang="ts">
	import { Menu, Github, X } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import Sidebar from './Sidebar.svelte';
	import { cn } from '$lib/utils';

	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="container flex h-14 items-center px-4 md:px-6">
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

		<a href="/" class="flex items-center gap-2 font-semibold">
			<span class="text-primary">Svelte-5 Grid</span>
		</a>

		<div class="flex-1"></div>

		<nav class="hidden md:flex items-center gap-6 text-sm">
			<a href="/docs" class="text-muted-foreground hover:text-foreground transition-colors">Docs</a>
			<a href="/examples" class="text-muted-foreground hover:text-foreground transition-colors">Examples</a>
		</nav>

		<div class="flex items-center gap-2 ml-4">
			<a
				href="https://github.com/KaiErikNiermann/svelte-grid-extended"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
				aria-label="GitHub"
			>
				<Github class="h-4 w-4" />
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
			<div class="fixed inset-y-0 left-0 top-14 w-72 border-r border-border bg-background p-6 overflow-y-auto">
				<Sidebar />
			</div>
		</div>
	{/if}
</header>
