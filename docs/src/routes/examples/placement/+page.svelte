<script lang="ts">
	import type { Collision } from '@appulsauce/svelte-grid';
	import ModeGrid from './ModeGrid.svelte';
	import { freshId, type ScenarioSpec, type Spec } from './types';

	const ALL: Collision[] = ['none', 'push', 'compress', 'shift'];
	const cell = (id: string, x: number, y: number, w = 1, h = 1): Spec => ({ id, x, y, w, h });

	const shiftCases: ScenarioSpec[] = [
		{
			id: 'S1',
			title: 'Approach from the left',
			steps: 'Drag a to the right over b and release.',
			expect: 'Once a covers half of b, b and c each step one cell right; the drop keeps that.',
			modes: ['shift'],
			cols: 5,
			items: [cell('a', 0, 0), cell('b', 1, 0), cell('c', 2, 0)]
		},
		{
			id: 'S2',
			title: 'Approach from above',
			steps: 'Drag a down over b and release.',
			expect: 'b and c each step one cell down.',
			modes: ['shift'],
			cols: 4,
			items: [cell('a', 1, 0), cell('b', 1, 1), cell('c', 1, 2)]
		},
		{
			id: 'S3',
			title: 'Approach from the right',
			steps: 'Drag a to the left over b and release.',
			expect: 'b steps one cell left.',
			modes: ['shift'],
			cols: 4,
			items: [cell('b', 1, 0), cell('a', 2, 0)]
		},
		{
			id: 'S4',
			title: 'Hovering below the threshold',
			steps:
				'Drag a less than halfway over b and hold, then further, then back to about a quarter.',
			expect:
				'Nothing moves while a covers less than half of b. Past half, b steps right; it stays there until a covers less than 30% of where b was, then returns.',
			modes: ['shift'],
			cols: 4,
			items: [cell('a', 0, 0), cell('b', 1, 0)]
		},
		{
			id: 'S5',
			title: 'Items return when the drag moves on',
			steps: 'Drag a over b so b and c move, then keep dragging down to row 3 and release.',
			expect: 'b and c go back to where they started; a lands in row 3.',
			modes: ['shift'],
			cols: 5,
			items: [cell('a', 0, 0), cell('b', 1, 0), cell('c', 2, 0)]
		},
		{
			id: 'S6',
			title: 'Wrapping at the right edge',
			steps: 'Drag a to the right over b, the last cell of the row, and release.',
			expect: 'b wraps to the start of the next row.',
			modes: ['shift'],
			cols: 4,
			items: [cell('a', 2, 0), cell('b', 3, 0)]
		},
		{
			id: 'S7',
			title: 'A small item over a wide one',
			steps: 'Drag a down onto the middle of the wide item b and release.',
			expect: 'b moves down as a whole; coverage is measured against the smaller of the two items.',
			modes: ['shift'],
			cols: 6,
			items: [cell('a', 2, 0), cell('b', 1, 1, 4, 1)]
		}
	];

	const placementCases: ScenarioSpec[] = [
		{
			id: 'P1',
			title: 'A new item declared on an occupied cell',
			steps: 'Click "Add n at (0, 0)".',
			expect: {
				none: 'n overlaps a: none mode applies positions as given.',
				push: 'n takes the first free cell in reading order, (1, 0).',
				compress: 'n is compressed in below a, at (0, 1).',
				shift: 'n takes the nearest free cell, (1, 0).'
			},
			modes: ALL,
			cols: 4,
			items: [cell('a', 0, 0)],
			actions: [
				{ label: 'Add n at (0, 0)', apply: (items) => [...items, cell(freshId(items), 0, 0)] }
			]
		},
		{
			id: 'P2',
			title: 'An item added under the drag',
			steps:
				'Press on a, drag it to another cell and keep holding. One second after the press, n is added under the outline. Then release.',
			expect: {
				none: 'n appears under the outline, and the outline steps back to the last free cell a passed (its own cell if there is none). a drops there; n stays where it was added.',
				push: 'a already sits in the cell it is dragged to, so n takes the first free cell.',
				compress: 'n is compressed in below a.',
				shift:
					'The cell under the outline counts as taken: n takes the nearest free cell and a drops where it was heading.'
			},
			modes: ALL,
			cols: 4,
			items: [cell('a', 0, 0)],
			duringDrag: 'add'
		},
		{
			id: 'P3',
			title: 'An item moved onto another by its props',
			steps: 'Click "Move b onto a".',
			expect: {
				none: 'b overlaps a.',
				push: 'b takes the cell and a is pushed to the first free cell.',
				compress: 'b takes the cell and a is pushed to the first free cell, as in push.',
				shift: 'b takes the cell and a is pushed to the first free cell, as in push.'
			},
			modes: ALL,
			cols: 4,
			items: [cell('a', 0, 0), cell('b', 2, 0)],
			actions: [
				{
					label: 'Move b onto a',
					apply: (items) => items.map((it) => (it.id === 'b' ? { ...it, x: 0, y: 0 } : it))
				}
			]
		},
		{
			id: 'P4',
			title: 'An item moved under the drag by its props',
			steps:
				'Press on a, drag it to another cell and keep holding. One second after the press, b is moved under the outline. Then release.',
			expect: {
				none: 'b moves under the outline, and the outline steps back to the last free cell a passed (its own cell if there is none). a drops there; b stays where it was moved.',
				push: 'b lands on a and pushes it away; the drop then puts a where it was heading and pushes b to the first free cell, so the two swap.',
				compress:
					'b lands on a and pushes it away; the drop then puts a where it was heading and pushes b to the first free cell, as in push.',
				shift:
					'The cell under the outline counts as taken: b goes to the nearest free cell and a drops where it was heading.'
			},
			modes: ALL,
			cols: 4,
			items: [cell('a', 0, 0), cell('b', 3, 2)],
			duringDrag: 'move'
		},
		{
			id: 'P5',
			title: 'Fractional and out-of-range props',
			steps: 'Click "Set b to x 2.6, w 9", then "Set b to y NaN".',
			expect:
				'x 2.6 is rounded to 3, then the width is capped at the 4 columns, which moves b back to x 0. NaN is ignored and b keeps its row.',
			modes: ALL,
			cols: 4,
			items: [cell('a', 0, 0), cell('b', 0, 1)],
			actions: [
				{
					label: 'Set b to x 2.6, w 9',
					apply: (items) => items.map((it) => (it.id === 'b' ? { ...it, x: 2.6, w: 9 } : it))
				},
				{
					label: 'Set b to y NaN',
					apply: (items) => items.map((it) => (it.id === 'b' ? { ...it, y: Number.NaN } : it))
				}
			]
		},
		{
			id: 'P6',
			title: 'An item without a position',
			steps: 'Click "Add n without x/y" a few times.',
			expect: {
				none: 'Each n takes the first free cell in reading order.',
				push: 'Each n takes the first free cell in reading order.',
				compress: 'Each n takes the first free cell in reading order.',
				shift: 'Each n takes the free cell nearest to (0, 0).'
			},
			modes: ALL,
			cols: 4,
			items: [cell('a', 0, 0), cell('b', 2, 0)],
			actions: [
				{
					label: 'Add n without x/y',
					apply: (items) => [...items, { id: freshId(items), w: 1, h: 1 }]
				}
			]
		},
		{
			id: 'P7',
			title: 'A full fixed-size grid frees a cell',
			steps: 'Click "Add n" once or more, then "Remove b".',
			expect:
				'The 2 x 1 grid is full, so each n has to overlap a. Removing b frees one cell: the first n moves into it and any others keep overlapping, since the grid has no other cell to give them.',
			modes: ['none'],
			cols: 2,
			rows: 1,
			items: [cell('a', 0, 0), cell('b', 1, 0)],
			actions: [
				{ label: 'Add n', apply: (items) => [...items, { id: freshId(items), w: 1, h: 1 }] },
				{
					label: 'Remove b',
					apply: (items) => items.filter((it) => it.id !== 'b'),
					enabled: (items) => items.some((it) => it.id === 'b')
				}
			]
		}
	];

	const sections = [
		{
			title: 'Shift: making way for a drag',
			intro:
				'How collision="shift" moves items while one is dragged. The layout is recomputed from where the items were when the drag started, so only the drop keeps it.',
			cases: shiftCases
		},
		{
			title: 'Placement in every mode',
			intro:
				'What each collision mode does when the app adds or moves items, including while the user is dragging.',
			cases: placementCases
		}
	];

	/** The expectation shown above one mode's grid; one shared by several modes sits above them all. */
	function expectFor(s: ScenarioSpec, mode: Collision): string | undefined {
		if (typeof s.expect !== 'string') return s.expect[mode];
		return s.modes.length === 1 ? s.expect : undefined;
	}
</script>

<svelte:head>
	<title>Placement Scenarios - Svelte Grid</title>
</svelte:head>

<div class="prose mb-6">
	<h1>Placement Scenarios</h1>
	<p>
		Each case has a fixed id, so it can be referred to directly, for example "P2 in push looks
		wrong". The readout below each grid shows every item's position and size, and flags overlaps.
	</p>
</div>

<aside class="callout mb-10">
	<p>
		If you disagree with a behaviour shown here, think it is wrong, or find it broken, please
		<a
			href="https://github.com/KaiErikNiermann/svelte-grid-extended/issues"
			target="_blank"
			rel="noopener noreferrer">open an issue on GitHub</a
		>
		and refer to the case by its id, for example "P4 in push". It is fine to open an issue even if you
		are not sure it is a bug, and suggestions are welcome.
	</p>
</aside>

<div class="flex flex-col gap-12">
	{#each sections as section (section.title)}
		<section class="flex flex-col gap-8">
			<div class="prose">
				<h2>{section.title}</h2>
				<p>{section.intro}</p>
			</div>
			<div class="cases">
				{#each section.cases as s (s.id)}
					<article
						id={s.id}
						class="case flex flex-col gap-3 scroll-mt-20 rounded-lg border border-border p-4"
						data-modes={s.modes.length > 1 ? 'many' : 'one'}
					>
						<h3 class="text-lg font-semibold">
							<a href={`#${s.id}`} class="hover:underline">{s.id}</a> · {s.title}
						</h3>
						<p class="text-sm">{s.steps}</p>
						{#if typeof s.expect === 'string' && s.modes.length > 1}
							<p class="text-sm text-muted-foreground">Expect: {s.expect}</p>
						{/if}
						<div class="modes">
							{#each s.modes as mode (mode)}
								<ModeGrid scenario={s} {mode} expect={expectFor(s, mode)} />
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	/* As many cards per row as fit at 16rem each: one on a phone, two or three on wider screens. */
	.cases {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
	}

	/* A case that compares several modes takes the whole row and lays its grids out the same way. */
	.case[data-modes='many'] {
		grid-column: 1 / -1;
	}

	/* Each mode's card spans six of these rows (see ModeGrid), so cards in one row line up. */
	.modes {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
	}
</style>
