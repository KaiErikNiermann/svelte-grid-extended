<script lang="ts">
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
</script>

<main class="min-h-screen bg-slate-50">
	<div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
		<header class="flex flex-col gap-2">
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
				Svelte Grid Extended
			</p>
			<h1 class="text-3xl font-semibold text-slate-900">Examples</h1>
			<p class="max-w-2xl text-base text-slate-600">
				Quick links to every example. Pick one and explore the behaviors in isolation.
			</p>
		</header>

		<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each examples as example}
				<a
					class="group flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
					href={`/examples/${example.slug}`}
				>
					<div class="flex flex-col gap-2">
						<h2 class="text-lg font-semibold text-slate-900 group-hover:text-slate-950">
							{example.title}
						</h2>
						<p class="text-sm text-slate-600">{example.description}</p>
					</div>
					<span class="mt-4 text-sm font-medium text-slate-500">Open example</span>
				</a>
			{/each}
		</section>
	</div>
</main>
