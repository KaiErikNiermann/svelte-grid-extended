<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	interface Props {
		children: import('svelte').Snippet;
	}

	interface Heading {
		id: string;
		text: string;
		level: 2 | 3;
	}

	let { children }: Props = $props();

	let content: HTMLElement | undefined = $state();
	let headings = $state<Heading[]>([]);
	let activeId = $state('');

	// A heading counts as the one being read from the moment it passes this far below the top
	// of the scrolling pane.
	const READING_LINE_PX = 96;

	/** The page's h2 and h3, read from the rendered Markdown; rehype-slug gives them their ids. */
	function readHeadings(): Heading[] {
		const found = content?.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]') ?? [];
		return [...found].map((el) => ({
			id: el.id,
			text: el.textContent?.trim() ?? el.id,
			level: el.tagName === 'H2' ? 2 : 3
		}));
	}

	/** The last heading above the reading line; the last one outright once the pane is scrolled to its end. */
	function findActive(pane: HTMLElement): string {
		const line = pane.getBoundingClientRect().top + READING_LINE_PX;
		const atEnd = pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 1;
		if (atEnd && headings.length > 0) return headings.at(-1)?.id ?? '';
		let active = headings[0]?.id ?? '';
		for (const { id } of headings) {
			const el = content?.querySelector(`#${CSS.escape(id)}`);
			if (el && el.getBoundingClientRect().top <= line) active = id;
		}
		return active;
	}

	// afterNavigate also runs once the page has mounted, so this covers the first load too.
	afterNavigate(() => {
		headings = readHeadings();
		activeId = '';
	});

	$effect(() => {
		const pane = content?.closest('main');
		if (!pane || headings.length === 0) return;
		let frame = 0;
		const update = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => (activeId = findActive(pane)));
		};
		update();
		pane.addEventListener('scroll', update, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			pane.removeEventListener('scroll', update);
		};
	});
</script>

<div class="docs-frame">
	<div class="docs-layout" data-toc={headings.length > 1}>
		<div class="prose" bind:this={content}>
			{@render children()}
		</div>

		{#if headings.length > 1}
			<aside class="toc" aria-label="On this page">
				<p class="toc-title">On this page</p>
				<ul>
					{#each headings as heading (heading.id)}
						<li data-level={heading.level}>
							<a
								href={`#${heading.id}`}
								aria-current={heading.id === activeId ? 'location' : undefined}
							>
								{heading.text}
							</a>
						</li>
					{/each}
				</ul>
			</aside>
		{/if}
	</div>
</div>
