<script lang="ts">
	import Demo, { type Strategy } from './Demo.svelte';

	const COLUMNS: { strategy: Strategy; title: string; note: string }[] = [
		{
			strategy: 'exact',
			title: 'Before: saved x/y as given',
			note: "Current none mode (placement='exact'): the revealed applets land on top of D."
		},
		{
			strategy: 'workaround',
			title: 'Before: app-side getFirstAvailablePosition()',
			note: 'Each blocked applet asks the controller before any of them mounts, so g1 and g2 get the same cell.'
		},
		{
			strategy: 'preferred',
			title: "After: placement='preferred'",
			note: 'A free saved cell is restored (g3); a blocked one goes to the nearest free cell; nothing else moves.'
		}
	];

	let demos = $state<Demo[]>([]);
	function all(action: (d: Demo) => void) {
		for (const d of demos) action(d);
	}
</script>

<main class="page">
	<header class="intro">
		<h1>Revealing a group with saved coordinates (collision="none")</h1>
		<p>
			Steps: hide group (g1-g3), then add D on their saved cells (or drag A/B/C there yourself), then reveal the group.
			All three grids get the same steps. Dragging stays plain none mode in every grid.
		</p>
		<div class="actions">
			<button onclick={() => all((d) => d.hideGroup())}>1. Hide group</button>
			<button onclick={() => all((d) => d.clutter())}>2. Add D on saved cells</button>
			<button onclick={() => all((d) => d.revealGroup())}>3. Reveal group</button>
			<button onclick={() => all((d) => d.reset())}>Reset</button>
		</div>
	</header>

	<div class="columns">
		{#each COLUMNS as col, i (col.strategy)}
			<section class="column">
				<h2>{col.title}</h2>
				<p class="note">{col.note}</p>
				<Demo strategy={col.strategy} bind:this={demos[i]} />
			</section>
		{/each}
	</div>
</main>

<style>
	.page {
		--space-1: 0.25rem;
		--space-2: 0.5rem;
		--space-3: 1rem;
		--space-4: 1.5rem;
		--radius: 4px;
		--text-xs: 0.75rem;
		--text-sm: 0.875rem;
		--text-md: 1rem;
		--text-lg: 1.25rem;
		--ink: #111;
		--muted: #555;
		--line: #999;
		--surface: #f4f4f4;
		--applet: #b9c6d6;
		--applet-group: #e6c98f;
		--good: #1d7a3a;
		--bad: #c0262d;

		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
		color: var(--ink);
		background: #fff;
		font-family:
			Inter,
			system-ui,
			-apple-system,
			sans-serif;
	}
	.intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-inline-size: 80ch;
	}
	h1 {
		font-size: var(--text-lg);
		font-weight: 600;
	}
	h2 {
		font-size: var(--text-md);
		font-weight: 600;
	}
	.intro p,
	.note {
		font-size: var(--text-sm);
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.actions button {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: var(--text-sm);
		cursor: pointer;
	}
	.columns {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
	}
	.column {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		inline-size: 28rem;
	}
</style>
