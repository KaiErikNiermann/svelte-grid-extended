<script lang="ts">
	import { onMount } from 'svelte';

	const examples = [
		{ slug: 'basic', title: 'Basic', description: 'Simple grid layout setup.' },
		{ slug: 'static-grid', title: 'Static Grid', description: 'Fixed rows or columns with item size.' },
		{ slug: 'without-bounds', title: 'Without Bounds', description: 'Infinite grid growth when rows or cols are zero.' },
		{ slug: 'styling', title: 'Styling', description: 'Classes and inline styles for grid items.' },
		{ slug: 'customization', title: 'Customization', description: 'Custom handles and slots.' },
		{ slug: 'custom-attributes', title: 'Custom Attributes', description: 'Pass extra attributes to items.' },
		{ slug: 'readonly', title: 'Read Only', description: 'Disable interactions on the grid.' },
		{ slug: 'disable-moving-or-resizing', title: 'Disable Moving or Resizing', description: 'Per-item controls.' },
		{ slug: 'binding', title: 'Two Way Binding', description: 'Bind item coordinates and dimensions.' },
		{ slug: 'events', title: 'Events', description: 'Listen to layout change events.' },
		{ slug: 'collision', title: 'Collision', description: 'Collision behavior overview.' },
		{ slug: 'collision-push', title: 'Collision Push', description: 'Push items on overlap.' },
		{ slug: 'collision-compress', title: 'Collision Compress', description: 'Compress items upward.' },
		{ slug: 'controller-compress', title: 'Controller Compress', description: 'Programmatically compress items.' },
		{ slug: 'add-remove-item', title: 'Add or Remove Item', description: 'Dynamic item changes.' },
		{ slug: 'grid-item-lets', title: 'GridItem Lets', description: 'Use lets for item state.' },
		{ slug: 'gh-48', title: 'GH-48', description: 'Reproduction case for issue 48.' },
		{ slug: 'gh-55', title: 'GH-55', description: 'Reproduction case for issue 55.' },
		{ slug: 'gh-57', title: 'GH-57', description: 'Reproduction case for issue 57.' }
	];

	let darkMode = $state(false);

	onMount(() => {
		const stored = localStorage.getItem('theme');
		darkMode = stored === 'forest';
	});

	function toggleTheme() {
		darkMode = !darkMode;
		localStorage.setItem('theme', darkMode ? 'forest' : 'emerald');
	}
</script>

<div class="min-h-screen bg-base-200 transition-colors duration-300" data-theme={darkMode ? 'forest' : 'emerald'}>
	<div class="mx-auto max-w-6xl px-6 py-12">
		<!-- Header -->
		<header class="mb-10">
			<div class="flex items-center justify-between mb-4">
				<span class="badge badge-primary badge-lg font-semibold tracking-wide">
					Svelte Grid Extended
				</span>
				<label class="btn btn-circle btn-ghost swap swap-rotate">
					<input type="checkbox" checked={darkMode} onchange={toggleTheme} />
					<!-- sun icon -->
					<svg class="swap-off h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
					</svg>
					<!-- moon icon -->
					<svg class="swap-on h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
					</svg>
				</label>
			</div>
			<h1 class="text-4xl font-bold text-base-content mb-3">Examples</h1>
			<p class="text-base-content/70 max-w-2xl">
				Quick links to every example. Pick one and explore the behaviors in isolation.
			</p>
		</header>

		<!-- Examples Grid -->
		<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each examples as example}
				<a
					href={`/examples/${example.slug}`}
					class="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-base-300"
				>
					<div class="card-body p-5">
						<h2 class="card-title text-base font-semibold">{example.title}</h2>
						<p class="text-sm text-base-content/60">{example.description}</p>
						<div class="card-actions justify-end mt-3">
							<span class="text-primary text-sm font-medium inline-flex items-center gap-1 group">
								View
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 transition-transform group-hover:translate-x-0.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</span>
						</div>
					</div>
				</a>
			{/each}
		</section>
	</div>
</div>
