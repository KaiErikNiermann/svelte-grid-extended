<script lang="ts">
	import Grid from '../../../src/lib/Grid.svelte';
	import GridItem from '../../../src/lib/GridItem.svelte';
	import type { GridController } from '../../../src/lib/types';
	import type { LayoutSpec } from './layout-types';

	let {
		grid,
		initial,
		onchange
	}: {
		grid: Record<string, unknown>;
		initial: LayoutSpec[];
		onchange?: (id: string) => void;
	} = $props();

	// Seeded once from the props; the test drives later changes through the exports.
	// svelte-ignore state_referenced_locally
	let items = $state<LayoutSpec[]>(structuredClone(initial));
	// svelte-ignore state_referenced_locally
	let gridProps = $state<Record<string, unknown>>({ ...grid });
	let controller = $state<GridController>();
	let visible = $state(true);

	export function add(...specs: LayoutSpec[]) {
		items.push(...specs);
	}
	export function remove(id: string) {
		items = items.filter((i) => i.id !== id);
	}
	export function patch(id: string, change: Partial<LayoutSpec>) {
		const target = items.find((i) => i.id === id);
		if (!target) throw new Error(`no item ${id}`);
		Object.assign(target, change);
	}
	export function setGrid(change: Record<string, unknown>) {
		Object.assign(gridProps, change);
	}
	export function snapshot(): LayoutSpec[] {
		return items.map((i) => ({ ...i }));
	}
	/** Mounts or destroys the whole grid inside the same component tree. */
	export function setVisible(show: boolean) {
		visible = show;
	}
	export function getController(): GridController | undefined {
		return controller;
	}
</script>

{#if visible}
	<Grid {...gridProps} bind:controller>
		{#each items as it (it.id)}
			<GridItem
				id={it.id}
				bind:x={it.x as number}
				bind:y={it.y as number}
				bind:w={it.w}
				bind:h={it.h}
				min={it.min}
				max={it.max}
				movable={it.movable}
				resizable={it.resizable}
				class={`it it-${it.id}`}
				previewClass={`pv pv-${it.id}`}
				onchange={() => onchange?.(it.id)}
			/>
		{/each}
	</Grid>
{/if}
