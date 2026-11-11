<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { ChevronDown } from 'lucide-svelte';

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
		mobileOpen = false;
	});

	// Narrow screens: the list folds into a bar under the header (see .toc-mobile in app.css).
	let mobileOpen = $state(false);
	let mobileToc: HTMLDetailsElement | undefined = $state();
	const activeText = $derived(
		headings.find((h) => h.id === activeId)?.text ?? headings[0]?.text ?? ''
	);

	// An open list closes on Escape and on a press anywhere outside it.
	$effect(() => {
		if (!mobileOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				mobileOpen = false;
				mobileToc?.querySelector('summary')?.focus();
			}
		};
		const onPress = (event: PointerEvent) => {
			if (!mobileToc?.contains(event.target as Node)) mobileOpen = false;
		};
		document.addEventListener('keydown', onKey);
		document.addEventListener('pointerdown', onPress);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onPress);
		};
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

{#snippet tocList(onpick?: () => void)}
	<ul>
		{#each headings as heading (heading.id)}
			<li data-level={heading.level}>
				<a
					href={`#${heading.id}`}
					aria-current={heading.id === activeId ? 'location' : undefined}
					onclick={onpick}
				>
					{heading.text}
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<div class="docs-frame">
	{#if headings.length > 1}
		<details class="toc-mobile" bind:open={mobileOpen} bind:this={mobileToc}>
			<summary>
				<span class="toc-mobile-label">On this page</span>
				<span class="toc-mobile-current">{activeText}</span>
				<ChevronDown class="toc-mobile-chevron" aria-hidden="true" />
			</summary>
			<nav class="toc toc-mobile-list" aria-label="On this page">
				{@render tocList(() => (mobileOpen = false))}
			</nav>
		</details>
	{/if}
	<div class="docs-layout" data-toc={headings.length > 1}>
		<div class="prose" bind:this={content}>
			{@render children()}
		</div>

		{#if headings.length > 1}
			<aside class="toc toc-side" aria-label="On this page">
				<p class="toc-title">On this page</p>
				{@render tocList()}
			</aside>
		{/if}
	</div>
</div>
