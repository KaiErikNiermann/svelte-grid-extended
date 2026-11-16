<script lang="ts" module>
	export type Strategy = 'exact' | 'workaround' | 'preferred';
</script>

<script lang="ts">
	import Grid, { GridItem, type GridController } from '#lib';

	type Applet = { id: string; x: number; y: number; w: number; h: number; group?: boolean };

	let { strategy }: { strategy: Strategy } = $props();

	const BASE: Applet[] = [
		{ id: 'A', x: 0, y: 0, w: 2, h: 2 },
		{ id: 'B', x: 2, y: 0, w: 2, h: 2 },
		{ id: 'C', x: 4, y: 0, w: 2, h: 2 }
	];
	/** The group's saved coordinates, as an app would keep them while the group is hidden. */
	const GROUP: Applet[] = [
		{ id: 'g1', x: 0, y: 2, w: 2, h: 1, group: true },
		{ id: 'g2', x: 2, y: 2, w: 2, h: 1, group: true },
		{ id: 'g3', x: 4, y: 2, w: 2, h: 1, group: true }
	];
	const CLUTTER: Applet = { id: 'D', x: 0, y: 2, w: 4, h: 1 };

	let applets = $state<Applet[]>(structuredClone([...BASE, ...GROUP]));
	let controller = $state<GridController>();

	const overlaps = (a: Applet, b: Applet) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

	const overlapping = $derived(
		new Set(applets.filter((a) => applets.some((b) => b !== a && overlaps(a, b))).map((a) => a.id))
	);

	export function reset() {
		applets = structuredClone([...BASE, ...GROUP]);
	}

	export function hideGroup() {
		applets = applets.filter((a) => !a.group);
	}

	/** Something else takes the group's saved cells while it is hidden. */
	export function clutter() {
		if (!applets.some((a) => a.id === CLUTTER.id)) applets = [...applets, { ...CLUTTER }];
	}

	export function revealGroup() {
		if (applets.some((a) => a.group)) return;
		applets = [...applets, ...GROUP.map((g) => ({ ...g, ...positionFor(g) }))];
	}

	/**
	 * The app-side workaround: keep the saved cell if no registered item covers it, else ask
	 * the controller. Every group member is computed before any of them mounts, so the
	 * controller cannot see the others and hands two of them the same cell.
	 */
	function positionFor(g: Applet): { x: number; y: number } {
		if (strategy !== 'workaround' || !controller) return { x: g.x, y: g.y };
		const registered = Object.values(controller.gridParams.items);
		if (!registered.some((r) => overlaps(g, r))) return { x: g.x, y: g.y };
		return controller.getFirstAvailablePosition(g.w, g.h) ?? { x: g.x, y: g.y };
	}
</script>

<div class="demo">
	<div class="frame">
		<Grid cols={8} rows={5} itemSize={{ width: 48, height: 48 }} gap={6} collision="none" bind:controller>
			{#each applets as a (a.id)}
				<GridItem
					id={a.id}
					bind:x={a.x}
					bind:y={a.y}
					bind:w={a.w}
					bind:h={a.h}
					placement={strategy === 'preferred' && a.group ? 'preferred' : 'exact'}
				>
					<div
						class="applet"
						data-group={a.group ? '' : undefined}
						data-overlap={overlapping.has(a.id) ? '' : undefined}
					>
						{a.id}
					</div>
				</GridItem>
			{/each}
		</Grid>
	</div>
	<p class="status" data-bad={overlapping.size > 0 ? '' : undefined}>
		{overlapping.size > 0 ? `Overlapping: ${[...overlapping].join(', ')}` : 'No overlaps'}
	</p>
	<ul class="coords">
		{#each applets as a (a.id)}
			<li>{a.id} ({a.x},{a.y})</li>
		{/each}
	</ul>
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.frame {
		inline-size: calc(8 * 48px + 9 * 6px);
		block-size: calc(5 * 48px + 6 * 6px);
		border: 1px dashed var(--line);
		background: var(--surface);
	}
	.applet {
		display: grid;
		place-items: center;
		inline-size: 100%;
		block-size: 100%;
		border-radius: var(--radius);
		background: var(--applet);
		color: var(--ink);
		font:
			600 var(--text-sm) / 1 system-ui,
			sans-serif;
		opacity: 0.9;
	}
	.applet[data-group] {
		background: var(--applet-group);
	}
	.applet[data-overlap] {
		outline: 3px solid var(--bad);
		outline-offset: -3px;
	}
	.status {
		font-size: var(--text-sm);
		color: var(--good);
	}
	.status[data-bad] {
		color: var(--bad);
	}
	.coords {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
		font:
			var(--text-xs) / 1.4 ui-monospace,
			monospace;
		color: var(--muted);
	}
</style>
