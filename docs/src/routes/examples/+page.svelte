<script lang="ts">
	import { match } from 'ts-pattern';
	import { base } from '$app/paths';

	const examples = [
		{ slug: 'basic', title: 'Basic', description: 'Simple grid layout setup', category: 'basics' },
		{
			slug: 'static-grid',
			title: 'Static Grid',
			description: 'Fixed dimensions with itemSize',
			category: 'basics'
		},
		{
			slug: 'without-bounds',
			title: 'Without Bounds',
			description: 'Infinite grid growth',
			category: 'basics'
		},
		{
			slug: 'styling',
			title: 'Styling',
			description: 'Classes and inline styles',
			category: 'styling'
		},
		{
			slug: 'customization',
			title: 'Customization',
			description: 'Custom move/resize handles',
			category: 'styling'
		},
		{
			slug: 'readonly',
			title: 'Read Only',
			description: 'Disable grid interactions',
			category: 'interaction'
		},
		{
			slug: 'binding',
			title: 'Two Way Binding',
			description: 'Bind item coordinates',
			category: 'interaction'
		},
		{
			slug: 'events',
			title: 'Events',
			description: 'Layout change callbacks',
			category: 'interaction'
		},
		{
			slug: 'collision-push',
			title: 'Collision Push',
			description: 'Push items on overlap',
			category: 'collision'
		},
		{
			slug: 'collision-compress',
			title: 'Collision Compress',
			description: 'Compress items upward',
			category: 'collision'
		},
		{
			slug: 'add-remove-item',
			title: 'Add/Remove Items',
			description: 'Dynamic item management',
			category: 'advanced'
		}
	] as const;

	type Category = (typeof examples)[number]['category'];

	function getCategoryColor(category: Category): string {
		return match(category)
			.with('basics', () => 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300')
			.with(
				'styling',
				() => 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
			)
			.with(
				'interaction',
				() => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
			)
			.with(
				'collision',
				() => 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
			)
			.with('advanced', () => 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300')
			.exhaustive();
	}
</script>

<svelte:head>
	<title>Examples - Svelte Grid</title>
</svelte:head>

<div class="prose">
	<h1>Examples</h1>
	<p>Interactive examples demonstrating various features of the grid component.</p>
</div>

<div class="grid gap-4 sm:grid-cols-2 mt-8">
	{#each examples as example}
		<a
			href={`${base}/examples/${example.slug}`}
			class="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
		>
			<div class="flex items-start justify-between gap-2 mb-2">
				<h3 class="font-semibold group-hover:text-primary transition-colors">{example.title}</h3>
				<span class={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(example.category)}`}>
					{example.category}
				</span>
			</div>
			<p class="text-sm text-muted-foreground">{example.description}</p>
		</a>
	{/each}
</div>
