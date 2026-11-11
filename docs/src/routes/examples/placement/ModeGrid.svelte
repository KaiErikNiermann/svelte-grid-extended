<script lang="ts">
	import Grid, { GridItem, type Collision } from '@appulsauce/svelte-grid';
	import { freshId, type ScenarioSpec, type Spec } from './types';

	let {
		scenario,
		mode,
		expect
	}: { scenario: ScenarioSpec; mode: Collision; expect: string | undefined } = $props();

	const DELAY_MS = 1000;
	// No width: cells take the panel width divided by cols, so the whole panel is the grid.
	const itemSize = { height: 40 };

	const fresh = () => scenario.items.map((it) => ({ ...it }));
	let items = $state<Spec[]>(fresh());
	let key = $state(0);
	let note = $state('');

	let pressed = false;
	let armed = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastPreview: { id: string; x: number; y: number } | undefined;

	const overlapping = $derived(
		items.some((a, i) =>
			items.some(
				(b, j) =>
					j > i &&
					a.x !== undefined &&
					b.x !== undefined &&
					a.y !== undefined &&
					b.y !== undefined &&
					a.x < b.x + b.w &&
					b.x < a.x + a.w &&
					a.y < b.y + b.h &&
					b.y < a.y + a.h
			)
		)
	);

	function reset() {
		clearTimeout(timer);
		pressed = armed = false;
		lastPreview = undefined;
		items = fresh();
		note = '';
		key += 1;
	}

	/** Where each item was when the press began; push and compress move the dragged one live. */
	let atPress = new Map<string, { x?: number; y?: number }>();

	function onPress() {
		if (!scenario.duringDrag) return;
		pressed = true;
		lastPreview = undefined;
		atPress = new Map(items.map((it) => [it.id, { x: it.x, y: it.y }]));
		clearTimeout(timer);
		timer = setTimeout(() => {
			armed = true;
			changeUnderDrag();
		}, DELAY_MS);
		window.addEventListener('pointerup', onRelease, { once: true });
	}

	function onRelease() {
		pressed = armed = false;
		clearTimeout(timer);
	}

	function onPreview(id: string, cell: { x: number; y: number }) {
		const start = atPress.get(id);
		if (!pressed || !start || (start.x === cell.x && start.y === cell.y)) return;
		lastPreview = { id, ...cell };
		changeUnderDrag();
	}

	function changeUnderDrag() {
		if (!armed || !lastPreview) return;
		armed = false;
		const { x, y } = lastPreview;
		if (scenario.duringDrag === 'add') {
			const id = freshId(items);
			items = [...items, { id, x, y, w: 1, h: 1 }];
			note = `${id} was added at (${x}, ${y}), under the outline. Release now.`;
		} else {
			items = items.map((it) => (it.id === 'b' ? { ...it, x, y } : it));
			note = `b was moved to (${x}, ${y}), under the outline. Release now.`;
		}
	}
</script>

<div class="flex flex-col gap-2 min-w-0 h-full">
	<code class="text-sm font-semibold">{mode}</code>
	<div class="flex flex-wrap gap-2">
		{#each scenario.actions ?? [] as action (action.label)}
			<button class="btn btn-sm btn-primary" onclick={() => (items = action.apply(items))}>
				{action.label}
			</button>
		{/each}
		<button class="btn btn-sm btn-outline" onclick={reset}>Reset</button>
	</div>
	{#if expect}<p class="text-sm text-muted-foreground">Expect: {expect}</p>{/if}
	<p class="font-mono text-xs">
		{items.map((it) => `${it.id} (${it.x ?? '-'}, ${it.y ?? '-'}) ${it.w}x${it.h}`).join(' · ')}
		{#if overlapping}<span class="text-red-600 dark:text-red-400"> · overlapping</span>{/if}
	</p>
	<p class="font-mono text-xs min-h-4">{note}</p>
	<div class="demo-panel mt-auto" onpointerdowncapture={onPress}>
		{#key key}
			<Grid
				class="grid-compact"
				cols={scenario.cols}
				rows={scenario.rows ?? 0}
				{itemSize}
				collision={mode}
				gap={4}
			>
				{#each items as it (it.id)}
					<GridItem
						id={it.id}
						bind:x={it.x}
						bind:y={it.y}
						bind:w={it.w}
						bind:h={it.h}
						class="grid-demo-item"
						onpreviewchange={({ item }) => onPreview(it.id, item)}
					>
						{#snippet children()}{it.id}{/snippet}
					</GridItem>
				{/each}
			</Grid>
		{/key}
	</div>
</div>
